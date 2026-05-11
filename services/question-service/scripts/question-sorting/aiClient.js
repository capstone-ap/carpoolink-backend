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
    'question-sorting',
    'compute_embedding_scores.py',
);

const FALLBACK = { relevance: 0.5, expertise: 0.5, proficiency: 0.5 };
const TIMEOUT_MS = 60_000;  // 모델 로딩 포함

function getPythonExecutable() {
    return process.env.QUESTION_SERVICE_PYTHON || 'python';
}

export async function fetchAiScores(request) {
    try {
        const { stdout, stderr } = await execFileAsync(
            getPythonExecutable(),
            [DEFAULT_SCRIPT_PATH, '--input', JSON.stringify(request)],
            { cwd: serviceRoot, timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 },
        );

        if (stderr && stderr.trim()) {
            console.warn('[answerability] python stderr:', stderr.trim());
        }

        const data = JSON.parse(stdout);
        return {
            relevance:   clamp(data.relevance),
            expertise:   clamp(data.expertise),
            proficiency: clamp(data.proficiency),
        };
    } catch (err) {
        console.warn('[answerability] Python 추론 실패, fallback 적용:', err.message);
        return FALLBACK;
    }
}
