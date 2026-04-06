import express from 'express';

const app = express();
const PORT = process.env.QUESTION_SERVICE_PORT || 4003;

app.get('/health', (req, res) => {
    res.json({ service: 'question-service', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`question-service running on http://localhost:${PORT}`);
});
