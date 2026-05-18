# question-service

Question detection, clustering, ranking, and recommendation service for live
mentoring sessions.

## Run

```bash
npm run dev -w services/question-service
```

For local Python scripts, set `QUESTION_SERVICE_PYTHON` to an environment that has
`services/question-service/requirements.txt` installed.

```powershell
$env:QUESTION_SERVICE_PYTHON="..\venv\Scripts\python.exe"
npm run dev -w services/question-service
```

## Python model API

The Python model logic can run as a long-lived FastAPI process so model
artifacts are loaded once and reused across requests. The model API exposes
question detection, question clustering, and ranking embedding scores.

Install the Python dependencies:

```powershell
..\venv\Scripts\python.exe -m pip install -r services\question-service\requirements.txt
```

Run the model API:

```powershell
npm.cmd run dev:question:model
```

You can also run the same app directly with Uvicorn:

```powershell
Set-Location services\question-service
..\..\..\venv\Scripts\python.exe -m uvicorn python_api.app:app --host 127.0.0.1 --port 8000
```

Set `QUESTION_PRELOAD_KC_ELECTRA=true` to load KC-ELECTRA during startup instead
of lazily on the first request routed to the neural model.

To route the Node question-service through the model API, start the model API
first, then run the Node service with:

```powershell
Set-Location C:\Users\admin\Desktop\Capstone_design_2026\Capstone\carpoolink
$env:QUESTION_MODEL_API_URL="http://127.0.0.1:8000"
npm.cmd run dev:question
```

With Docker Compose, `question-service` is wired to the internal
`question-model-api` service automatically.

## API

### `POST /api/question-detection/predict`

Request body:

```json
{
  "text": "혹시 몇 시에 출발해?"
}
```

### `POST /api/question-clustering/cluster`

Request body:

```json
{
  "questions": [
    { "question_id": "q1", "text": "이 부분 다시 설명해주실 수 있나요?" },
    { "question_id": "q2", "text": "이 부분을 한 번 더 설명해 주세요" },
    { "question_id": "q3", "text": "과제 제출일이 언제인가요?" }
  ],
  "threshold": 0.72,
  "similarityMode": "hybrid"
}
```

Response fields include `cluster_count`, `clusters`, and per-question
`assignments` with `rule_score`, optional `embedding_score`, and final
`similarity_score`.

### `POST /api/questions/rank`

For one question, send `question` plus optional live-session context. For a
clustered question list, call `/api/question-clustering/cluster` first, then pass
that result as `clustering`.

```json
{
  "sessionTopic": "React state management",
  "currentScriptSection": "useState updates are reflected on the next render.",
  "questions": [
    { "id": "q1", "text": "Why does useState not update immediately?", "isPaid": true },
    { "id": "q2", "text": "When does useEffect run?", "isPaid": false }
  ],
  "clustering": {
    "question_count": 2,
    "cluster_count": 1,
    "threshold": 0.5,
    "similarity_mode": "rule",
    "clusters": [
      {
        "cluster_id": "cluster_1",
        "representative_question_id": "q1",
        "representative_question": "Why does useState not update immediately?",
        "member_questions": [
          { "question_id": "q1", "text": "Why does useState not update immediately?" },
          { "question_id": "q2", "text": "When does useEffect run?" }
        ]
      }
    ]
  }
}
```

## Environment Variables

- `QUESTION_SERVICE_PORT`: HTTP port. Defaults to `4003`.
- `QUESTION_MODEL_API_URL`: FastAPI model API base URL. When set, question detection, clustering, and ranking embedding scoring use HTTP instead of spawning Python subprocesses.
- `QUESTION_SERVICE_PYTHON`: Python executable path for inference and clustering.
- `QUESTION_DETECTION_SCRIPT_PATH`: override hybrid detection script path.
- `QUESTION_TFIDF_ARTIFACT_DIR`: TF-IDF artifact directory.
- `QUESTION_KC_ELECTRA_DIR`: KC-ELECTRA artifact directory.
- `QUESTION_DETECTION_TIMEOUT_MS`: inference subprocess timeout.
- `QUESTION_ALWAYS_USE_KC_ELECTRA_ON_RULE_QUESTION`: `true` to force KC-ELECTRA confirmation for strong rule-question cases.
- `QUESTION_CLUSTERING_SCRIPT_PATH`: override clustering API script path.
- `QUESTION_CLUSTERING_THRESHOLD`: default clustering threshold.
- `QUESTION_CLUSTERING_SIMILARITY_MODE`: `rule`, `hybrid`, or `embedding`. Defaults to `hybrid`.
- `QUESTION_CLUSTERING_EMBEDDING_MODEL`: embedding model alias or Hugging Face model id.
- `QUESTION_CLUSTERING_TIMEOUT_MS`: clustering subprocess timeout.
