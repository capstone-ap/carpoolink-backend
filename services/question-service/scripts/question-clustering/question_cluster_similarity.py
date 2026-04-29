from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable

SCRIPT_DIR = Path(__file__).resolve().parent
SCRIPTS_ROOT = SCRIPT_DIR.parent
QUESTION_DETECTION_DIR = SCRIPTS_ROOT / "question-detection"

if str(QUESTION_DETECTION_DIR) not in sys.path:
    sys.path.insert(0, str(QUESTION_DETECTION_DIR))

from preprocess_question_detection_for_tfidf import normalize_for_tfidf
from question_detection_rules import extract_rule_features, safe_text

try:
    from sentence_transformers import SentenceTransformer
    from sentence_transformers.util import cos_sim
except ImportError:  # pragma: no cover - optional runtime dependency
    SentenceTransformer = None
    cos_sim = None


DEFAULT_STOPWORDS = {
    "이",
    "그",
    "저",
    "것",
    "거",
    "좀",
    "수",
    "때",
    "걸",
    "를",
    "을",
    "은",
    "는",
    "이요",
    "요",
    "좀요",
    "혹시",
    "약간",
    "그냥",
    "진짜",
    "정말",
}

QUESTION_ENDING_NORMALIZATION_RULES = (
    (r"(인가요|인가요\?)$", "인가요"),
    (r"(일까요|일까요\?|일까여)$", "일까요"),
    (r"(되나요|되나요\?)$", "되나요"),
    (r"(할까요|할까요\?)$", "할까요"),
    (r"(해야 할까요|해야할까요|해야 할까)$", "해야할까요"),
    (r"(궁금합니다|궁금한데요|궁금해요)$", "궁금합니다"),
)

TOKEN_PATTERN = re.compile(r"[0-9A-Za-z가-힣]+")

EMBEDDING_MODEL_ALIASES = {
    "distiluse": "sentence-transformers/distiluse-base-multilingual-cased-v2",
    "mpnet": "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
    "bge-m3": "BAAI/bge-m3",
}


@dataclass(frozen=True)
class SimilaritySignals:
    original_text: str
    candidate_text: str
    original_canonical: str
    candidate_canonical: str
    exact_match: bool
    canonical_match: bool
    contains_other: bool
    sequence_ratio: float
    token_jaccard: float
    token_overlap_ratio: float
    shared_token_count: int
    rule_score: float
    embedding_score: float | None
    final_score: float


class EmbeddingSimilarityEngine:
    def __init__(self, model_name: str) -> None:
        if SentenceTransformer is None or cos_sim is None:
            raise ImportError(
                "sentence-transformers is required for embedding clustering. "
                "Install it with `pip install sentence-transformers`."
            )

        self.requested_model_name = model_name
        self.model_name = EMBEDDING_MODEL_ALIASES.get(model_name, model_name)
        self.model = SentenceTransformer(self.model_name)
        self.embedding_cache: dict[str, object] = {}

    def encode(self, text: str):
        canonical_text = canonicalize_question_text(text)
        cache_key = canonical_text or safe_text(text)
        if cache_key in self.embedding_cache:
            return self.embedding_cache[cache_key]

        embedding = self.model.encode(
            cache_key,
            convert_to_tensor=True,
            normalize_embeddings=True,
        )
        self.embedding_cache[cache_key] = embedding
        return embedding

    def similarity(self, text: str, candidate_text: str) -> float:
        source_embedding = self.encode(text)
        candidate_embedding = self.encode(candidate_text)
        score = float(cos_sim(source_embedding, candidate_embedding).item())
        return round(score, 4)


def canonicalize_question_text(text: str) -> str:
    canonical = normalize_for_tfidf(safe_text(text))
    canonical = canonical.replace("[url]", " ").replace("[email]", " ")
    canonical = re.sub(r"[!?.,]+", " ", canonical)
    canonical = re.sub(r"\s+", " ", canonical).strip()

    for pattern, replacement in QUESTION_ENDING_NORMALIZATION_RULES:
        canonical = re.sub(pattern, replacement, canonical)

    return canonical


def extract_keyword_tokens(text: str) -> list[str]:
    canonical = canonicalize_question_text(text)
    tokens = TOKEN_PATTERN.findall(canonical)
    return [token for token in tokens if token not in DEFAULT_STOPWORDS and len(token) > 1]


def _jaccard_similarity(left: set[str], right: set[str]) -> float:
    if not left and not right:
        return 1.0
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def _overlap_ratio(left: Iterable[str], right: Iterable[str]) -> tuple[float, int]:
    left_list = list(left)
    right_list = list(right)
    if not left_list or not right_list:
        return 0.0, 0

    left_set = set(left_list)
    right_set = set(right_list)
    shared_count = len(left_set & right_set)
    denominator = min(len(left_set), len(right_set))
    return shared_count / denominator if denominator else 0.0, shared_count


def compute_rule_similarity_score(text: str, candidate_text: str) -> SimilaritySignals:
    source = safe_text(text)
    candidate = safe_text(candidate_text)
    source_canonical = canonicalize_question_text(source)
    candidate_canonical = canonicalize_question_text(candidate)

    source_tokens = extract_keyword_tokens(source)
    candidate_tokens = extract_keyword_tokens(candidate)
    source_token_set = set(source_tokens)
    candidate_token_set = set(candidate_tokens)

    exact_match = source == candidate and bool(source)
    canonical_match = source_canonical == candidate_canonical and bool(source_canonical)
    contains_other = bool(source_canonical) and bool(candidate_canonical) and (
        source_canonical in candidate_canonical or candidate_canonical in source_canonical
    )
    sequence_ratio = SequenceMatcher(None, source_canonical, candidate_canonical).ratio()
    token_jaccard = _jaccard_similarity(source_token_set, candidate_token_set)
    token_overlap_ratio, shared_token_count = _overlap_ratio(source_tokens, candidate_tokens)

    rule_score = 0.0
    if exact_match:
        rule_score += 1.0
    if canonical_match:
        rule_score += 0.95
    elif contains_other:
        rule_score += 0.2

    rule_score += sequence_ratio * 0.35
    rule_score += token_jaccard * 0.30
    rule_score += token_overlap_ratio * 0.15

    if shared_token_count >= 3:
        rule_score += 0.05

    rule_score = min(rule_score, 1.0)

    return SimilaritySignals(
        original_text=source,
        candidate_text=candidate,
        original_canonical=source_canonical,
        candidate_canonical=candidate_canonical,
        exact_match=exact_match,
        canonical_match=canonical_match,
        contains_other=contains_other,
        sequence_ratio=round(sequence_ratio, 4),
        token_jaccard=round(token_jaccard, 4),
        token_overlap_ratio=round(token_overlap_ratio, 4),
        shared_token_count=shared_token_count,
        rule_score=round(rule_score, 4),
        embedding_score=None,
        final_score=round(rule_score, 4),
    )


def compute_similarity_signals(
    text: str,
    candidate_text: str,
    embedding_engine: EmbeddingSimilarityEngine | None = None,
) -> SimilaritySignals:
    base_signals = compute_rule_similarity_score(text, candidate_text)
    embedding_score = None

    if embedding_engine is not None:
        embedding_score = embedding_engine.similarity(text, candidate_text)

    final_score = base_signals.rule_score
    if embedding_score is not None:
        if base_signals.exact_match or base_signals.canonical_match:
            final_score = 1.0
        else:
            final_score = min(
                1.0,
                (base_signals.rule_score * 0.30) + (embedding_score * 0.70),
            )

    return SimilaritySignals(
        original_text=base_signals.original_text,
        candidate_text=base_signals.candidate_text,
        original_canonical=base_signals.original_canonical,
        candidate_canonical=base_signals.candidate_canonical,
        exact_match=base_signals.exact_match,
        canonical_match=base_signals.canonical_match,
        contains_other=base_signals.contains_other,
        sequence_ratio=base_signals.sequence_ratio,
        token_jaccard=base_signals.token_jaccard,
        token_overlap_ratio=base_signals.token_overlap_ratio,
        shared_token_count=base_signals.shared_token_count,
        rule_score=base_signals.rule_score,
        embedding_score=embedding_score,
        final_score=round(final_score, 4),
    )


def is_cluster_match(signals: SimilaritySignals, threshold: float = 0.72) -> bool:
    if signals.exact_match or signals.canonical_match:
        return True

    if (
        signals.sequence_ratio >= 0.88
        and signals.token_overlap_ratio >= 0.6
        and signals.shared_token_count >= 2
    ):
        return True

    if signals.embedding_score is not None and signals.embedding_score >= 0.84:
        return True

    return signals.final_score >= threshold


def score_representative_question(text: str) -> float:
    normalized_text = safe_text(text)
    features = extract_rule_features(normalized_text)
    keyword_tokens = extract_keyword_tokens(normalized_text)

    score = 0.0
    score += min(features["char_len"], 60) / 60 * 0.25
    score += min(len(keyword_tokens), 8) / 8 * 0.25
    score += 0.2 if features["has_question_mark"] else 0.0
    score += 0.15 if features["has_question_ending"] else 0.0
    score += 0.10 if features["has_question_word"] else 0.0
    score += 0.05 if features["has_formal_request"] else 0.0
    score -= 0.10 if features["is_short_text"] else 0.0
    score -= 0.10 if features["has_reaction_like"] else 0.0

    return round(score, 4)
