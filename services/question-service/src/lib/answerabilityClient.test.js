import assert from 'node:assert/strict';
import test from 'node:test';

import { rankQuestion } from './answerabilityClient.js';

const originalQuestionModelApiUrl = process.env.QUESTION_MODEL_API_URL;
const originalFetch = globalThis.fetch;

test.afterEach(() => {
    if (originalQuestionModelApiUrl === undefined) {
        delete process.env.QUESTION_MODEL_API_URL;
    } else {
        process.env.QUESTION_MODEL_API_URL = originalQuestionModelApiUrl;
    }
    globalThis.fetch = originalFetch;
});

test('ranks an existing clustering result without reclustering', async () => {
    const requests = [];
    process.env.QUESTION_MODEL_API_URL = 'http://localhost:8000';
    globalThis.fetch = async (url, options) => {
        requests.push({ url, options });
        return new Response(JSON.stringify({
            relevance: 0.7,
            flow_fit: 0.8,
            expertise: 0.6,
            redundancy_penalty: 0,
        }));
    };

    const result = await rankQuestion({
        sessionTopic: 'React state management',
        currentScriptSection: 'useState updates are reflected on the next render.',
        mentorProfile: 'React frontend mentor',
        menteeProfile: 'Beginner React learner',
        questions: [
            {
                id: 'q1',
                text: 'Why does the useState value not update immediately?',
                isPaid: true,
            },
            {
                id: 'q2',
                text: 'When does useEffect run?',
                isPaid: false,
            },
        ],
        clustering: {
            question_count: 2,
            cluster_count: 1,
            threshold: 0.5,
            similarity_mode: 'rule',
            embedding_model: null,
            clusters: [
                {
                    cluster_id: 'cluster_1',
                    representative_question_id: 'q1',
                    representative_question: 'Why does the useState value not update immediately?',
                    best_match_score: 0.71,
                    member_questions: [
                        {
                            question_id: 'q1',
                            text: 'Why does the useState value not update immediately?',
                        },
                        {
                            question_id: 'q2',
                            text: 'When does useEffect run?',
                        },
                    ],
                },
            ],
        },
    });

    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, 'http://localhost:8000/question-ranking/scores');
    assert.equal(result.clustering.questionCount, 2);
    assert.equal(result.clustering.clusterCount, 1);
    assert.equal(result.rankedQuestions.length, 1);
    assert.equal(result.clusters.length, 1);
    assert.equal(result.clusters[0].clusterId, 'cluster_1');
    assert.equal(result.clusters[0].clusterSize, 2);
    assert.equal(result.clusters[0].questions.length, 2);
    assert.equal(result.clusters[0].questions.some(question => question.id === 'q1' && question.isPaid), true);
    assert.equal(result.clusters[0].questions.every(question => question.priorityGroup), true);
});
