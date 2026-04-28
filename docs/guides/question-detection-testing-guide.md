# 질문 탐지 모델 테스트 가이드

## 문서 목적

이 문서는 질문 탐지 모델을 로컬에서 불러와 테스트하는 방법을 정리한 가이드입니다.

다음 상황에서 사용할 수 있습니다.

- 규칙 기반 패턴이 제대로 동작하는지 빠르게 확인하고 싶을 때
- 하이브리드 추론 스크립트가 정상 동작하는지 확인하고 싶을 때
- `question-service` API를 실행해서 실제 요청을 보내보고 싶을 때
- 테스트셋 전체 또는 일부에 대해 성능과 응답 시간을 확인하고 싶을 때

기준 작업 디렉토리:

- `carpoolink`

사용할 Python 경로 예시:

- `..\venv\Scripts\python.exe`

## 1. 사전 준비

### 필수 파일

아래 데이터 또는 모델 아티팩트가 로컬에 있어야 합니다.

- `data/processed/question_detection/train.csv`
- `data/processed/question_detection/valid.csv`
- `data/processed/question_detection/test.csv`
- `services/model/question_detection/tfidf_lr_rule_filter_off`
- `services/model/question_detection/tfidf_lr_rule_filter_on`
- `services/model/question_detection/kc_electra_question_detector`

### 설치 확인

PowerShell에서 아래 명령어로 Python 환경을 확인합니다.

```powershell
..\venv\Scripts\python.exe --version
```

Node 기반 API 테스트를 하려면 `npm install`이 되어 있어야 합니다.

### 데이터와 모델 다운로드

필요한 파일이 로컬에 없으면 DVC로 먼저 내려받습니다.

질문 탐지 split 데이터만 받기:

```powershell
dvc pull data/processed/question_detection/train.csv.dvc data/processed/question_detection/valid.csv.dvc data/processed/question_detection/test.csv.dvc
```

TF-IDF 준비 데이터까지 받기:

```powershell
dvc pull data/processed/question_detection/train.csv.dvc data/processed/question_detection/valid.csv.dvc data/processed/question_detection/test.csv.dvc data/processed/question_detection/tfidf_ready.dvc
```

질문 탐지 모델 전체 받기:

```powershell
dvc pull services/model/question_detection.dvc
```

참고 용량:

- train / valid / test split: 약 200MB
- 원본 데이터: 약 2.1GB
- 질문 탐지 모델 전체: 약 5.5GB

### TF-IDF artifact 선택 기준

질문 탐지용 TF-IDF artifact는 두 버전이 있습니다.

- `services/model/question_detection/tfidf_lr_rule_filter_off`
- `services/model/question_detection/tfidf_lr_rule_filter_on`

차이:

- `filter_off`: 규칙 기반 pre-filter를 끄고 TF-IDF 모델 점수만으로 판단
- `filter_on`: 규칙 기반 질문/비질문 선별을 먼저 적용한 뒤 TF-IDF와 결합

현재 저장된 비교 결과 기준:

- `filter_off`가 test 기준 F1이 더 높음
- 그래서 현재 하이브리드 추론 스크립트와 benchmark 스크립트 기본값도 `tfidf_lr_rule_filter_off`로 설정되어 있음

관련 비교 문서:

- `services/question-service/outputs/question_detection/variant_comparison/comparison_report.md`

실무적으로는 아래처럼 이해하면 됩니다.

- 기본 테스트, 재현, 현재 서비스 흐름 확인: `filter_off`
- 규칙 기반 필터 적용 버전 재비교 또는 실험: `filter_on`

## 2. 규칙만 빠르게 테스트하기

존댓말 질문 어미나 요청형 표현이 규칙에 잘 잡히는지 확인할 때 사용합니다.

```powershell
..\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, r'services/question-service/scripts'); from question_detection_rules import classify_question_by_rules, extract_rule_features; samples = ['이 방향이 맞을까요?', '피드백 주실 수 있나요?', '이 부분 설명해주실 수 있나요?', '좋겠네요', '감사합니다']; [print(text, '->', classify_question_by_rules(text), extract_rule_features(text)) for text in samples]"
```

결과 해석 기준:

- `rule_strong_question`이면 규칙이 질문으로 바로 판별한 경우
- `has_question_ending=True`이면 질문형 종결 어미가 감지된 경우
- `has_formal_request=True`이면 요청형 표현이 감지된 경우
- `(None, 'model')`이면 규칙만으로 확정하지 않고 모델 판단으로 넘기는 경우

## 3. 하이브리드 추론 스크립트 직접 실행하기

TF-IDF와 KcELECTRA를 포함한 하이브리드 추론을 서버 없이 직접 확인할 수 있습니다.

```powershell
..\venv\Scripts\python.exe services/question-service/scripts/run_hybrid_question_pipeline.py --text "이 방향이 맞을까요?" --tfidf-artifact-dir services/model/question_detection/tfidf_lr_rule_filter_off --kc-electra-dir services/model/question_detection/kc_electra_question_detector
```

이 명령은 JSON 형태로 결과를 출력합니다.

주요 필드:

- `is_question`: 최종 질문 여부
- `decision_source`: 최종 판단 주체
- `route_reason`: 어떤 경로로 판단했는지
- `rule_reason`: 규칙이 개입했다면 어떤 규칙이 작동했는지
- `used_kc_electra`: KcELECTRA를 실제로 사용했는지

`filter_on` 버전으로 비교하고 싶다면 `--tfidf-artifact-dir`만 아래처럼 바꾸면 됩니다.

```powershell
..\venv\Scripts\python.exe services/question-service/scripts/run_hybrid_question_pipeline.py --text "이 방향이 맞을까요?" --tfidf-artifact-dir services/model/question_detection/tfidf_lr_rule_filter_on --kc-electra-dir services/model/question_detection/kc_electra_question_detector
```

## 4. question-service API 실행 후 테스트하기

### 서버 실행

PowerShell에서 `carpoolink` 기준으로 실행합니다.

```powershell
$env:QUESTION_SERVICE_PYTHON="C:\Users\admin\Desktop\Capstone_design_2026\Capstone\venv\Scripts\python.exe"
npm.cmd run dev:question
```

정상 실행되면 아래와 비슷한 로그가 출력됩니다.

```text
question-service running on http://localhost:4003
```

### 단건 요청 보내기

다른 PowerShell 창에서:

```powershell
$body = @{ text = "이 방향이 맞을까요?" } | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:4003/api/question-detection/predict" `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

이 방식은 Windows PowerShell에서 한글 JSON 전송 시 비교적 안정적입니다.

## 5. benchmark 스크립트로 테스트셋 평가하기

### 일부 샘플만 빠르게 확인

```powershell
..\venv\Scripts\python.exe services/question-service/scripts/benchmark_question_detection.py --test-path data/processed/question_detection/test.csv --output-dir services/question-service/outputs/question_detection/benchmark_smoke --max-samples 100
```

### 전체 test.csv 기준 평가

```powershell
..\venv\Scripts\python.exe services/question-service/scripts/benchmark_question_detection.py --test-path data/processed/question_detection/test.csv --output-dir services/question-service/outputs/question_detection/benchmark_full
```

`filter_on` artifact로 평가하려면:

```powershell
..\venv\Scripts\python.exe services/question-service/scripts/benchmark_question_detection.py --test-path data/processed/question_detection/test.csv --output-dir services/question-service/outputs/question_detection/benchmark_filter_on --tfidf-artifact-dir services/model/question_detection/tfidf_lr_rule_filter_on
```

### API 경유 기준으로 평가

서버를 실행한 뒤 아래처럼 `--mode api`를 사용합니다.

```powershell
..\venv\Scripts\python.exe services/question-service/scripts/benchmark_question_detection.py --mode api --test-path data/processed/question_detection/test.csv --output-dir services/question-service/outputs/question_detection/benchmark_api
```

## 6. benchmark 결과 확인

benchmark 실행 후 아래 파일들이 생성됩니다.

- `test_predictions_with_latency.csv`
- `benchmark_summary.json`
- `classification_report.txt`

주요 확인 포인트:

- `avg_latency_ms`
- `median_latency_ms`
- `p95_latency_ms`
- `accuracy`
- `precision_1`
- `recall_1`
- `f1_1`

## 7. 자주 쓰는 테스트 시나리오

### 존댓말 질문 테스트

- `이 방향이 맞을까요?`
- `설명해주실 수 있나요?`
- `피드백 주실 수 있나요?`
- `이 경험을 어떻게 정리하면 좋을까요?`

### 비질문 반응 테스트

- `좋겠네요`
- `감사합니다`
- `그렇군요`
- `대단하네요`

### 애매한 문장 테스트

- `제가 이렇게 이해한 게 맞나요`
- `도움이 될까요`
- `이 부분은 조금 헷갈립니다`

## 8. 참고

관련 스크립트:

- `services/question-service/scripts/question_detection_rules.py`
- `services/question-service/scripts/run_hybrid_question_pipeline.py`
- `services/question-service/scripts/benchmark_question_detection.py`
- `services/question-service/src/server.js`
- `services/question-service/src/lib/questionDetectorClient.js`

관련 문서:

- `docs/guides/question-detection-preparation-status.md`
- `services/question-service/README.md`
