from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


APP_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = APP_DIR.parent
REPO_ROOT = SERVICE_ROOT.parent.parent
QUESTION_DETECTION_SCRIPT_DIR = SERVICE_ROOT / "scripts" / "question-detection"
QUESTION_CLUSTERING_SCRIPT_DIR = SERVICE_ROOT / "scripts" / "question-clustering"
QUESTION_RANKING_SCRIPT_DIR = SERVICE_ROOT / "scripts" / "question-ranking"

sys.path.insert(0, str(QUESTION_DETECTION_SCRIPT_DIR))
sys.path.insert(0, str(QUESTION_CLUSTERING_SCRIPT_DIR))
sys.path.insert(0, str(QUESTION_RANKING_SCRIPT_DIR))

from question_detection_inference import (  # noqa: E402
    HybridQuestionDetector,
    HybridQuestionDetectorConfig,
)
from question_clustering_inference import (  # noqa: E402
    QuestionClusterer,
    QuestionClusteringConfig,
)
from compute_embedding_scores import (  # noqa: E402
    compute_expertise,
    compute_flow_fit,
    compute_redundancy_penalty,
    compute_relevance,
    get_model,
    normalize_text_list,
)


DEFAULT_TFIDF_ARTIFACT_DIR = REPO_ROOT / "services" / "model" / "question_detection" / "tfidf_lr_rule_filter_off"
DEFAULT_KC_ELECTRA_DIR = REPO_ROOT / "services" / "model" / "question_detection" / "kc_electra_question_detector"


class QuestionDetectionRequest(BaseModel):
    text: str = Field(..., description="Chat text to classify as a question or non-question.")


class QuestionClusteringRequest(BaseModel):
    questions: list[Any]
    threshold: float | None = None
    similarityMode: str | None = None
    similarity_mode: str | None = None
    embeddingModel: str | None = None
    embedding_model: str | None = None


class QuestionRankingScoresRequest(BaseModel):
    question: str
    session_topic: str = ""
    previous_script_sections: list[str] = Field(default_factory=list)
    current_script_section: str = ""
    current_slide_title: str = ""
    next_script_section: str = ""
    recent_mentor_utterances: list[str] = Field(default_factory=list)
    mentor_profile: str = ""
    mentor_expertise_evidence: list[str] = Field(default_factory=list)
    mentor_past_scripts: list[str] = Field(default_factory=list)
    answered_questions: list[str] = Field(default_factory=list)
    queued_questions: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    service: str
    status: str
    detector_loaded: bool
    clusterer_loaded: bool


detector: HybridQuestionDetector | None = None
clusterer: QuestionClusterer | None = None


def env_bool(name: str, default: bool = False) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.lower() in {"1", "true", "yes", "y", "on"}


def env_float(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return float(raw_value)
    except ValueError:
        return default


def build_detector_config() -> HybridQuestionDetectorConfig:
    tfidf_artifact_dir = Path(os.getenv("QUESTION_TFIDF_ARTIFACT_DIR", str(DEFAULT_TFIDF_ARTIFACT_DIR)))
    kc_electra_dir = Path(os.getenv("QUESTION_KC_ELECTRA_DIR", str(DEFAULT_KC_ELECTRA_DIR)))

    return HybridQuestionDetectorConfig(
        tfidf_artifact_dir=tfidf_artifact_dir,
        kc_electra_dir=kc_electra_dir,
        tfidf_low_confidence=env_float("QUESTION_TFIDF_LOW_CONFIDENCE", 0.15),
        tfidf_high_confidence=env_float("QUESTION_TFIDF_HIGH_CONFIDENCE", 0.85),
        tfidf_margin=env_float("QUESTION_TFIDF_MARGIN", 0.10),
        always_use_kc_electra_on_rule_question=env_bool(
            "QUESTION_ALWAYS_USE_KC_ELECTRA_ON_RULE_QUESTION",
            False,
        ),
    )


def build_clustering_config() -> QuestionClusteringConfig:
    return QuestionClusteringConfig(
        threshold=env_float("QUESTION_CLUSTERING_THRESHOLD", 0.72),
        similarity_mode=os.getenv("QUESTION_CLUSTERING_SIMILARITY_MODE", "hybrid"),
        embedding_model=os.getenv("QUESTION_CLUSTERING_EMBEDDING_MODEL", "distiluse"),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global detector, clusterer
    config = build_detector_config()
    detector = HybridQuestionDetector(
        config,
        preload_kc_electra=env_bool("QUESTION_PRELOAD_KC_ELECTRA", False),
    )
    clusterer = QuestionClusterer()
    yield
    detector = None
    clusterer = None


app = FastAPI(
    title="Carpoolink Question Model API",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        service="question-model-api",
        status="ok",
        detector_loaded=detector is not None,
        clusterer_loaded=clusterer is not None,
    )


@app.post("/question-detection/predict")
def predict_question(request: QuestionDetectionRequest) -> dict[str, Any]:
    if detector is None:
        raise HTTPException(status_code=503, detail="Question detector is not loaded.")

    return detector.predict(request.text)


@app.post("/question-clustering/cluster")
def cluster_questions(request: QuestionClusteringRequest) -> dict[str, Any]:
    if clusterer is None:
        raise HTTPException(status_code=503, detail="Question clusterer is not loaded.")

    payload = request.model_dump(exclude_none=True)
    if request.similarityMode is not None:
        payload["similarity_mode"] = request.similarityMode
    if request.embeddingModel is not None:
        payload["embedding_model"] = request.embeddingModel

    try:
        return clusterer.cluster(payload, build_clustering_config())
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/question-ranking/scores")
def score_question_ranking(request: QuestionRankingScoresRequest) -> dict[str, float]:
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="question must be a non-empty string.")

    model = get_model()
    previous_script_sections = normalize_text_list(request.previous_script_sections)
    recent_mentor_utterances = normalize_text_list(request.recent_mentor_utterances)
    mentor_expertise_evidence = normalize_text_list(request.mentor_expertise_evidence)
    mentor_past_scripts = normalize_text_list(request.mentor_past_scripts)
    answered_questions = normalize_text_list(request.answered_questions)
    queued_questions = normalize_text_list(request.queued_questions)

    return {
        "relevance": compute_relevance(
            model,
            request.question,
            request.session_topic,
            recent_mentor_utterances,
            previous_script_sections,
        ),
        "flow_fit": compute_flow_fit(
            model,
            request.question,
            previous_script_sections,
            request.current_script_section,
            request.current_slide_title,
            request.next_script_section,
        ),
        "expertise": compute_expertise(
            model,
            request.question,
            request.mentor_profile,
            mentor_expertise_evidence,
            previous_script_sections,
            mentor_past_scripts,
        ),
        "redundancy_penalty": compute_redundancy_penalty(
            model,
            request.question,
            answered_questions,
            queued_questions,
        ),
    }
