"""
SBERT 기반 Answerability 임베딩 점수 계산
- relevance  : 질문 ↔ 세션 주제 + 멘토 최근 발화 유사도
- expertise  : 질문 ↔ 멘토 프로필 유사도
- proficiency: 질문 ↔ 멘토 과거 스크립트 유사도 (cold start → 0.5)

사용법:
  python compute_embedding_scores.py --input '<JSON>'
"""

import sys
import json
import argparse
import numpy as np
from sentence_transformers import SentenceTransformer, util

MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def cos_sim(a, b) -> float:
    """코사인 유사도를 0~1로 정규화"""
    raw = float(util.cos_sim(a, b))
    return (raw + 1) / 2


def compute_relevance(model, question: str, session_topic: str, recent_utterances: list) -> float:
    q_emb = model.encode(question)

    scores = []
    if session_topic:
        t_emb = model.encode(session_topic)
        scores.append((0.4, cos_sim(q_emb, t_emb)))

    if recent_utterances:
        recent_text = ' '.join(recent_utterances[-5:])
        r_emb = model.encode(recent_text)
        scores.append((0.6, cos_sim(q_emb, r_emb)))

    if not scores:
        return 0.5

    total_weight = sum(w for w, _ in scores)
    return float(np.clip(sum(w * s for w, s in scores) / total_weight, 0, 1))


def compute_expertise(model, question: str, mentor_profile: str) -> float:
    if not mentor_profile:
        return 0.5
    q_emb = model.encode(question)
    p_emb = model.encode(mentor_profile)
    return float(np.clip(cos_sim(q_emb, p_emb), 0, 1))


def compute_proficiency(model, question: str, past_scripts: list) -> float:
    if not past_scripts:
        return 0.5  # cold start

    q_emb = model.encode(question)
    s_embs = model.encode(past_scripts)

    matched = sum(1 for s_emb in s_embs if cos_sim(q_emb, s_emb) > 0.7)
    total = len(past_scripts)

    raw = matched / max(total, 1)
    score = 1 / (1 + np.exp(-(raw * 10 - 5)))  # sigmoid
    return float(np.clip(score + 0.5, 0, 1))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='JSON 형태의 입력')
    args = parser.parse_args()

    data = json.loads(args.input)
    question              = data.get('question', '')
    session_topic         = data.get('session_topic', '')
    recent_utterances     = data.get('recent_mentor_utterances', [])
    mentor_profile        = data.get('mentor_profile', '')
    past_scripts          = data.get('mentor_past_scripts', [])

    model = get_model()

    result = {
        'relevance':   compute_relevance(model, question, session_topic, recent_utterances),
        'expertise':   compute_expertise(model, question, mentor_profile),
        'proficiency': compute_proficiency(model, question, past_scripts),
    }

    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
