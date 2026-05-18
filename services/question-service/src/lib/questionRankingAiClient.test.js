import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchAiScores } from '../../scripts/question-ranking/aiClient.js';

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

test('fetches ranking embedding scores through the configured model API', async () => {
    const requests = [];
    process.env.QUESTION_MODEL_API_URL = 'http://localhost:8000/';
    globalThis.fetch = async (url, options) => {
        requests.push({ url, options });
        return new Response(JSON.stringify({
            relevance: 0.7,
            flow_fit: 0.8,
            expertise: 0.6,
            redundancy_penalty: 0.1,
        }));
    };

    const result = await fetchAiScores({
        question: 'useState 값이 바로 안 바뀌는 이유가 뭔가요?',
    });

    assert.equal(requests[0].url, 'http://localhost:8000/question-ranking/scores');
    assert.equal(JSON.parse(requests[0].options.body).question, 'useState 값이 바로 안 바뀌는 이유가 뭔가요?');
    assert.equal(result.rankingMode, 'hybrid');
    assert.equal(result.relevance, 0.7);
    assert.equal(result.flowFit, 0.8);
    assert.equal(result.expertise, 0.6);
    assert.equal(result.redundancyPenalty, 0.1);
    assert.deepEqual(result.warnings, []);
});
