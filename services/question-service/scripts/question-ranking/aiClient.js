import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clamp } from './utils.js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const serviceRoot = path.resolve(__dirname, '..', '..');

const DEFAULT_SCRIPT_PATH = path.join(
    serviceRoot,
    'scripts',
    'question-ranking',
    'compute_embedding_scores.py',
);

const FALLBACK = {
    relevance: 0.5,
    flowFit: 0.5,
    expertise: 0.5,
    redundancyPenalty: 0,
    rankingMode: 'fallback',
    warnings: ['AI embedding scores unavailable; fallback scores applied.'],
};
const TIMEOUT_MS = 60_000;

function getModelApiUrl() {
    const rawValue = process.env.QUESTION_MODEL_API_URL;
    if (!rawValue) {
        return null;
    }

    return rawValue.replace(/\/+$/, '');
}

function getPythonExecutable() {
    return process.env.QUESTION_SERVICE_PYTHON || 'python';
}

function normalizeAiScoreResponse(data, rankingMode = 'hybrid') {
    return {
        relevance:   clamp(data.relevance),
        flowFit:     clamp(data.flow_fit ?? data.flowFit),
        expertise:   clamp(data.expertise),
        redundancyPenalty: clamp(data.redundancy_penalty ?? data.redundancyPenalty ?? 0),
        rankingMode,
        warnings: [],
    };
}

async function fetchAiScoresViaModelApi(request, modelApiUrl) {
    const response = await fetch(`${modelApiUrl}/question-ranking/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    const responseBody = await response.text();

    if (!response.ok) {
        throw new Error(`Question ranking model API failed with status ${response.status}: ${responseBody}`);
    }

    return normalizeAiScoreResponse(JSON.parse(responseBody), 'hybrid');
}

async function fetchAiScoresViaPythonCli(request) {
    const { stdout, stderr } = await execFileAsync(
        getPythonExecutable(),
        [DEFAULT_SCRIPT_PATH, '--input', JSON.stringify(request)],
        { cwd: serviceRoot, timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 },
    );

    if (stderr && stderr.trim()) {
        console.warn('[answerability] python stderr:', stderr.trim());
    }

    return normalizeAiScoreResponse(JSON.parse(stdout), 'hybrid');
}

export async function fetchAiScores(request) {
    const modelApiUrl = getModelApiUrl();

    try {
        if (modelApiUrl) {
            return await fetchAiScoresViaModelApi(request, modelApiUrl);
        }

        return await fetchAiScoresViaPythonCli(request);
    } catch (err) {
        console.warn('[answerability] AI scoring failed, fallback applied:', err.message);
        return FALLBACK;
    }
}
