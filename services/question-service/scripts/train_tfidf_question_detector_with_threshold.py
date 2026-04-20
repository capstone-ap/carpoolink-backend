from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.pipeline import Pipeline


# =========================================================
# 인자 파싱
# =========================================================
def parse_args() -> argparse.Namespace:
    """
    TF-IDF + Logistic Regression 기반 질문 탐지 모델을 학습하고,
    validation set에서 threshold를 탐색하기 위한 인자를 정의한다.
    """
    parser = argparse.ArgumentParser(
        description="Train TF-IDF question detector and find best threshold on validation set."
    )
    parser.add_argument(
        "--train-path",
        type=str,
        default="data/processed/question_detection/tfidf_ready/train.csv",
        help="Path to train csv",
    )
    parser.add_argument(
        "--valid-path",
        type=str,
        default="data/processed/question_detection/tfidf_ready/valid.csv",
        help="Path to valid csv",
    )
    parser.add_argument(
        "--test-path",
        type=str,
        default="data/processed/question_detection/tfidf_ready/test.csv",
        help="Path to test csv",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="services/question-service/outputs/question_detection/tfidf_lr_threshold",
        help="Directory to save reports and threshold search results",
    )
    parser.add_argument(
        "--max-features",
        type=int,
        default=50000,
        help="Maximum number of TF-IDF features",
    )
    parser.add_argument(
        "--ngram-max",
        type=int,
        default=2,
        help="Use ngram_range=(1, ngram_max)",
    )
    parser.add_argument(
        "--c-value",
        type=float,
        default=1.0,
        help="Inverse regularization strength for Logistic Regression",
    )
    parser.add_argument(
        "--max-iter",
        type=int,
        default=1000,
        help="Maximum iterations for Logistic Regression",
    )
    parser.add_argument(
        "--use-class-weight",
        action="store_true",
        help="Use class_weight='balanced'",
    )
    parser.add_argument(
        "--threshold-start",
        type=float,
        default=0.05,
        help="Threshold sweep start",
    )
    parser.add_argument(
        "--threshold-end",
        type=float,
        default=0.95,
        help="Threshold sweep end",
    )
    parser.add_argument(
        "--threshold-step",
        type=float,
        default=0.05,
        help="Threshold sweep step",
    )
    parser.add_argument(
        "--optimize-metric",
        type=str,
        default="f1",
        choices=["f1", "recall", "precision"],
        help="Metric to optimize on validation set",
    )
    parser.add_argument(
        "--error-sample-size",
        type=int,
        default=200,
        help="Number of FP/FN samples to save",
    )
    return parser.parse_args()


# =========================================================
# 데이터 로드
# =========================================================
def load_dataset(path: str) -> pd.DataFrame:
    """
    전처리 완료된 split csv를 로드한다.
    사용 컬럼:
    - text
    - text_preprocessed
    - label
    """
    df = pd.read_csv(path)
    df = df[["text", "text_preprocessed", "label"]].copy()
    return df


# =========================================================
# 모델 생성
# =========================================================
def build_pipeline(
    max_features: int,
    ngram_max: int,
    c_value: float,
    max_iter: int,
    use_class_weight: bool,
) -> Pipeline:
    """
    TF-IDF + Logistic Regression 파이프라인 생성
    """
    class_weight = "balanced" if use_class_weight else None

    pipeline = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    max_features=max_features,
                    ngram_range=(1, ngram_max),
                    lowercase=False,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    C=c_value,
                    max_iter=max_iter,
                    class_weight=class_weight,
                    solver="liblinear",
                    random_state=42,
                ),
            ),
        ]
    )
    return pipeline


# =========================================================
# 평가 지표 계산
# =========================================================
def calculate_binary_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    이진 분류 결과에 대해 precision / recall / f1 / accuracy를 계산한다.
    질문 클래스(label=1)를 기준으로 계산한다.
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    tp = int(((y_true == 1) & (y_pred == 1)).sum())
    tn = int(((y_true == 0) & (y_pred == 0)).sum())
    fp = int(((y_true == 0) & (y_pred == 1)).sum())
    fn = int(((y_true == 1) & (y_pred == 0)).sum())

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )
    accuracy = (tp + tn) / len(y_true) if len(y_true) > 0 else 0.0

    return {
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
    }


# =========================================================
# threshold 탐색
# =========================================================
def search_best_threshold(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold_start: float,
    threshold_end: float,
    threshold_step: float,
    optimize_metric: str,
) -> tuple[float, pd.DataFrame]:
    """
    validation set에서 threshold sweep을 수행하고,
    지정한 metric 기준으로 최적 threshold를 찾는다.
    """
    rows = []

    thresholds = np.arange(
        threshold_start,
        threshold_end + 1e-9,
        threshold_step,
    )

    for threshold in thresholds:
        y_pred = (y_prob >= threshold).astype(int)
        metrics = calculate_binary_metrics(y_true, y_pred)

        row = {
            "threshold": round(float(threshold), 4),
            **metrics,
        }
        rows.append(row)

    result_df = pd.DataFrame(rows)

    # 동률일 경우 보통 threshold가 너무 낮아 과도하게 질문으로 잡는 걸 막기 위해
    # precision을 2차 기준으로, threshold를 3차 기준으로 본다.
    result_df = result_df.sort_values(
        by=[optimize_metric, "precision", "threshold"],
        ascending=[False, False, False],
    ).reset_index(drop=True)

    best_threshold = float(result_df.iloc[0]["threshold"])
    return best_threshold, result_df


# =========================================================
# 문자열 저장
# =========================================================
def save_text(path: Path, text: str) -> None:
    """
    텍스트 파일 저장
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8-sig")


# =========================================================
# split 평가 및 저장
# =========================================================
def evaluate_with_threshold(
    model: Pipeline,
    df: pd.DataFrame,
    split_name: str,
    threshold: float,
    output_dir: Path,
    error_sample_size: int,
) -> None:
    """
    특정 split에 대해 score(probability)를 뽑고,
    threshold를 적용한 결과를 평가/저장한다.
    """
    x = df["text_preprocessed"]
    y_true = df["label"].to_numpy()

    # 질문(label=1) 확률 점수
    y_prob = model.predict_proba(x)[:, 1]

    # threshold 적용
    y_pred = (y_prob >= threshold).astype(int)

    # 텍스트 리포트
    report = classification_report(
        y_true,
        y_pred,
        digits=4,
        zero_division=0,
    )
    cm = confusion_matrix(y_true, y_pred)

    print(f"\n===== [{split_name.upper()} @ threshold={threshold:.2f}] =====")
    print(report)
    print(cm)

    save_text(
        output_dir / f"{split_name}_classification_report.txt",
        report,
    )
    save_text(
        output_dir / f"{split_name}_confusion_matrix.txt",
        str(cm),
    )

    # score 포함 결과 저장
    result_df = df.copy()
    result_df["score"] = y_prob
    result_df["pred"] = y_pred
    result_df["correct"] = (result_df["label"] == result_df["pred"]).astype(int)

    result_df.to_csv(
        output_dir / f"{split_name}_predictions_with_scores.csv",
        index=False,
        encoding="utf-8-sig",
    )

    # 오분류 샘플 저장
    error_df = result_df[result_df["correct"] == 0].copy()

    fn_df = error_df[(error_df["label"] == 1) & (error_df["pred"] == 0)].copy()
    fp_df = error_df[(error_df["label"] == 0) & (error_df["pred"] == 1)].copy()

    fn_df = fn_df.sort_values(by="score", ascending=True).head(error_sample_size)
    fp_df = fp_df.sort_values(by="score", ascending=False).head(error_sample_size)

    fn_df.to_csv(
        output_dir / f"{split_name}_false_negative_samples.csv",
        index=False,
        encoding="utf-8-sig",
    )
    fp_df.to_csv(
        output_dir / f"{split_name}_false_positive_samples.csv",
        index=False,
        encoding="utf-8-sig",
    )


# =========================================================
# 메인
# =========================================================
def main() -> None:
    """
    전체 실행 흐름:
    1. train 학습
    2. valid에서 확률(score) 추출
    3. threshold sweep
    4. best threshold 선택
    5. valid/test 평가 및 저장
    """
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 데이터 로드
    train_df = load_dataset(args.train_path)
    valid_df = load_dataset(args.valid_path)
    test_df = load_dataset(args.test_path)

    print("[INFO] train size:", len(train_df))
    print("[INFO] valid size:", len(valid_df))
    print("[INFO] test size :", len(test_df))
    print("[INFO] use_class_weight:", args.use_class_weight)

    # 모델 생성 및 학습
    model = build_pipeline(
        max_features=args.max_features,
        ngram_max=args.ngram_max,
        c_value=args.c_value,
        max_iter=args.max_iter,
        use_class_weight=args.use_class_weight,
    )

    print("\n[INFO] Training model...")
    model.fit(train_df["text_preprocessed"], train_df["label"])
    print("[INFO] Training completed.")

    # validation 점수 추출
    valid_prob = model.predict_proba(valid_df["text_preprocessed"])[:, 1]
    valid_true = valid_df["label"].to_numpy()

    # threshold 탐색
    best_threshold, threshold_df = search_best_threshold(
        y_true=valid_true,
        y_prob=valid_prob,
        threshold_start=args.threshold_start,
        threshold_end=args.threshold_end,
        threshold_step=args.threshold_step,
        optimize_metric=args.optimize_metric,
    )

    print(f"\n[INFO] Best threshold on valid ({args.optimize_metric}): {best_threshold:.2f}")

    # threshold 탐색 결과 저장
    threshold_df.to_csv(
        output_dir / "threshold_search_results.csv",
        index=False,
        encoding="utf-8-sig",
    )

    save_text(
        output_dir / "best_threshold.txt",
        f"best_threshold={best_threshold:.4f}\noptimize_metric={args.optimize_metric}\n",
    )

    # valid/test 평가
    evaluate_with_threshold(
        model=model,
        df=valid_df,
        split_name="valid",
        threshold=best_threshold,
        output_dir=output_dir,
        error_sample_size=args.error_sample_size,
    )

    evaluate_with_threshold(
        model=model,
        df=test_df,
        split_name="test",
        threshold=best_threshold,
        output_dir=output_dir,
        error_sample_size=args.error_sample_size,
    )

    print("\n[DONE] Threshold search and evaluation completed.")


if __name__ == "__main__":
    main()