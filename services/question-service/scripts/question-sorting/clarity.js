import { clamp } from './utils.js';

const VAGUE_WORDS = [
  '좀', '약간', '뭔가', '그냥', '막', '대충',
  '어느정도', '어느 정도', '아무거나', '아무렇게나', '뭐든', '뭐든지',
];

const QUESTION_MARKERS = [
  '뭐', '왜', '어디', '언제', '누구', '얼마', '몇',
  '어떻게', '어떤', '무슨', '어느', '누가', '무엇',
];

export function scoreClarity(question) {
  const trimmed = question.trim();
  if (!trimmed) return 0;

  const tokens = trimmed.split(/\s+/);
  const vagueCount = tokens.filter(t => VAGUE_WORDS.some(vw => t.includes(vw))).length;
  const vagueWordRatio = vagueCount / tokens.length;

  const hasNumber = /\d+/.test(trimmed);
  const hasQuestionMarker = QUESTION_MARKERS.some(m => trimmed.includes(m));
  const specificityBonus = (hasNumber ? 0.1 : 0) + (hasQuestionMarker ? 0.1 : 0);

  return clamp(1 - vagueWordRatio + specificityBonus);
}
