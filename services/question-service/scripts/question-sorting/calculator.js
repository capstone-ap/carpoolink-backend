import { scoreClarity } from './clarity.js';
import { scoreSufficiency } from './sufficiency.js';
import { fetchAiScores } from './aiClient.js';
import { clamp } from './utils.js';

const WEIGHTS = {
  clarity:     0.20,
  sufficiency: 0.20,
  relevance:   0.20,
  expertise:   0.20,
  proficiency: 0.20,
};

export async function computeAnswerability(input) {
  const {
    question,
    isPaid = false,
    sessionTopic = '',
    recentMentorUtterances = [],
    mentorProfile = '',
    mentorPastScripts = [],
  } = input;

  const clarity     = scoreClarity(question);
  const sufficiency = scoreSufficiency(question);

  const { relevance, expertise, proficiency } = await fetchAiScores({
    question,
    session_topic:             sessionTopic,
    recent_mentor_utterances:  recentMentorUtterances,
    mentor_profile:            mentorProfile,
    mentor_past_scripts:       mentorPastScripts,
  });

  let priorityScore =
    WEIGHTS.clarity     * clarity     +
    WEIGHTS.sufficiency * sufficiency +
    WEIGHTS.relevance   * relevance   +
    WEIGHTS.expertise   * expertise   +
    WEIGHTS.proficiency * proficiency;

  // Q축 평균이 0.4 미만이면 전체 점수에 0.5 cap
  if ((clarity + sufficiency) / 2 < 0.4) {
    priorityScore *= 0.5;
  }

  if (isPaid) priorityScore += 0.2;

  return {
    priorityScore: clamp(priorityScore),
    scores: { clarity, sufficiency, relevance, expertise, proficiency },
  };
}
