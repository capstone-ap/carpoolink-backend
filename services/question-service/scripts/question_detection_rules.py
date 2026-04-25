from __future__ import annotations

import re
from typing import Any


QUESTION_WORD_PATTERNS = [
    r"뭐",
    r"뭔데",
    r"뭐야",
    r"무슨",
    r"무엇",
    r"어떤",
    r"어디",
    r"언제",
    r"왜",
    r"어째서",
    r"어떻게",
    r"얼마",
    r"몇\s*부작",
    r"몇\s*개",
    r"몇\s*명",
    r"누구",
    r"누가",
    r"누굴",
    r"어땠",
    r"어때",
    r"어떰",
    r"어떻",
    r"가능할까",
    r"알\s*수\s*있을까",
]

QUESTION_ENDING_PATTERNS = [
    r"야\?$",
    r"인가\?$",
    r"인거야\?$",
    r"거야\?$",
    r"거지\?$",
    r"거야$",
    r"거지$",
    r"건가\?$",
    r"건데\?$",
    r"는데\?$",
    r"을까\?$",
    r"ㄹ까\?$",
    r"있어\?$",
    r"있나\?$",
    r"없나\?$",
    r"같아\?$",
    r"싶어\?$",
    r"싶은데\?$",
    r"보네\?$",
    r"봤어\?$",
    r"했어\?$",
    r"되었대\?$",
    r"되는거지\?$",
    r"인\s*거\s*봄\?$",
]

FORMAL_REQUEST_PATTERNS = [
    r"알려줄\s*수\s*있어\??",
    r"알려줘",
    r"설명해\s*줘",
    r"추천해\s*줘",
    r"말해\s*줘",
    r"가르쳐\s*줘",
    r"보여줄\s*수\s*있어\??",
    r"정리해\s*줘",
]

CHAT_STYLE_PATTERNS = [
    r"머임",
    r"뭥미",
    r"실화냐",
    r"레알\??",
    r"ㄹㅇ\??",
    r"ㅇㄸ",
    r"몇\s*부작인데",
    r"누군데",
    r"어딘데",
    r"뭔데",
]

REACTION_PATTERNS = [
    r"ㅋㅋ+",
    r"ㅎㅎ+",
    r"ㅠㅠ+",
    r"ㅜㅜ+",
    r"헐",
    r"대박",
    r"우와",
    r"와+",
    r"오+",
    r"아하",
    r"오호",
    r"헉",
    r"맞아",
    r"그렇구나",
    r"글쿤",
    r"글쿠",
    r"다행이다",
    r"좋겠다",
    r"대단하네",
    r"신기하네",
]

NON_QUESTION_START_PATTERNS = [
    r"^뭐야[,.! ]",
    r"^아니[,.! ]",
    r"^대박[,.! ]",
    r"^헐[,.! ]",
    r"^우와[,.! ]",
    r"^와[~.! ]",
    r"^오[~.! ]",
    r"^아하[,.! ]",
    r"^그렇구나",
    r"^글쿤",
    r"^글쿠",
    r"^처음 들었",
    r"^처음 들어봤",
    r"^다행이다",
    r"^대단하네",
    r"^좋겠다",
    r"^신기하네",
]

NON_QUESTION_END_PATTERNS = [
    r"좋겠다[.!]?$",
    r"다행이다[.!]?$",
    r"대단하네[.!]?$",
    r"신기하네[.!]?$",
    r"처음 들어봤지 뭐야[.!]?$",
    r"알겠다[.!]?$",
]

SPECIAL_ONLY_PATTERN = r"^[\W_]+$"


def safe_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() == "nan":
        return ""
    return text


def contains_any_pattern(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text) for pattern in patterns)


def extract_rule_features(text: str) -> dict[str, Any]:
    text = safe_text(text)
    has_question_mark = "?" in text
    has_question_word = contains_any_pattern(text, QUESTION_WORD_PATTERNS)
    has_question_ending = contains_any_pattern(text, QUESTION_ENDING_PATTERNS)
    has_formal_request = contains_any_pattern(text, FORMAL_REQUEST_PATTERNS)
    has_chat_style_question = contains_any_pattern(text, CHAT_STYLE_PATTERNS)
    has_reaction_like = contains_any_pattern(text, REACTION_PATTERNS)
    has_non_question_start = contains_any_pattern(text, NON_QUESTION_START_PATTERNS)
    has_non_question_ending = contains_any_pattern(text, NON_QUESTION_END_PATTERNS)
    char_len = len(text)

    question_signal_count = sum(
        [
            has_question_mark,
            has_question_word,
            has_question_ending,
            has_formal_request,
            has_chat_style_question,
        ]
    )

    return {
        "text": text,
        "char_len": char_len,
        "token_len_by_space": len(text.split()) if text else 0,
        "has_question_mark": has_question_mark,
        "has_question_word": has_question_word,
        "has_question_ending": has_question_ending,
        "has_formal_request": has_formal_request,
        "has_chat_style_question": has_chat_style_question,
        "has_reaction_like": has_reaction_like,
        "has_non_question_start": has_non_question_start,
        "has_non_question_ending": has_non_question_ending,
        "is_short_text": char_len <= 6,
        "is_very_short_text": char_len <= 3,
        "is_special_only": bool(re.fullmatch(SPECIAL_ONLY_PATTERN, text)) if text else False,
        "question_signal_count": question_signal_count,
    }


def classify_question_by_rules(text: str) -> tuple[int | None, str]:
    features = extract_rule_features(text)

    if not features["text"]:
        return 0, "rule_empty_text"

    if (
        features["has_formal_request"]
        or (
            features["has_question_mark"]
            and (
                features["has_question_word"]
                or features["has_question_ending"]
                or features["has_chat_style_question"]
            )
        )
        or (
            features["has_question_mark"]
            and features["question_signal_count"] >= 2
        )
    ):
        return 1, "rule_strong_question"

    if (
        not features["has_question_mark"]
        and features["has_non_question_start"]
        and features["question_signal_count"] <= 1
    ):
        return 0, "rule_reaction_statement"

    if (
        not features["has_question_mark"]
        and features["has_non_question_ending"]
        and features["question_signal_count"] == 0
    ):
        return 0, "rule_statement_ending"

    if (
        features["is_very_short_text"]
        and features["has_reaction_like"]
        and not features["has_question_mark"]
    ):
        return 0, "rule_short_reaction"

    return None, "model"


def build_pattern_combo_label(features: dict[str, Any]) -> str:
    tags = []

    if features["has_question_mark"]:
        tags.append("qmark")
    if features["has_question_word"]:
        tags.append("qword")
    if features["has_question_ending"]:
        tags.append("qending")
    if features["has_formal_request"]:
        tags.append("request")
    if features["has_chat_style_question"]:
        tags.append("chatq")
    if features["has_reaction_like"]:
        tags.append("reaction")
    if features["has_non_question_start"]:
        tags.append("nonqstart")
    if features["has_non_question_ending"]:
        tags.append("nonqend")
    if features["is_short_text"]:
        tags.append("short")
    if features["is_special_only"]:
        tags.append("special")

    if not tags:
        return "no_signal"

    return "+".join(tags)


def export_rule_config() -> dict[str, Any]:
    return {
        "question_word_patterns": QUESTION_WORD_PATTERNS,
        "question_ending_patterns": QUESTION_ENDING_PATTERNS,
        "formal_request_patterns": FORMAL_REQUEST_PATTERNS,
        "chat_style_patterns": CHAT_STYLE_PATTERNS,
        "reaction_patterns": REACTION_PATTERNS,
        "non_question_start_patterns": NON_QUESTION_START_PATTERNS,
        "non_question_end_patterns": NON_QUESTION_END_PATTERNS,
        "special_only_pattern": SPECIAL_ONLY_PATTERN,
    }
