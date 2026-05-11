import { computeAnswerability } from '../../scripts/question-sorting/calculator.js';

export async function rankQuestion(input) {
    const {
        question,
        isPaid            = false,
        sessionTopic      = '',
        recentMentorUtterances = [],
        mentorProfile     = '',
        mentorPastScripts = [],
    } = input;

    if (typeof question !== 'string' || !question.trim()) {
        throw new Error('`question` must be a non-empty string.');
    }

    return computeAnswerability({
        question,
        isPaid,
        sessionTopic,
        recentMentorUtterances,
        mentorProfile,
        mentorPastScripts,
    });
}
