import express from 'express';

const app = express();
const PORT = process.env.QUESTION_QUEUE_PORT || 4004;

app.use(express.json());

const queue = [];

app.post('/api/questions', (req, res) => {
    const item = {
        id: `q_${Date.now()}`,
        content: req.body.content,
        amount: req.body.amount || 0,
        likes: req.body.likes || 0,
        privateReply: !!req.body.privateReply,
        createdAt: new Date().toISOString()
    };
    queue.push(item);
    res.status(201).json(item);
});

app.get('/api/questions', (req, res) => {
    const sorted = [...queue].sort((a, b) => (b.amount + b.likes) - (a.amount + a.likes));
    res.json(sorted);
});

app.get('/health', (req, res) => {
    res.json({ service: 'question-queue', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`question-queue running on http://localhost:${PORT}`);
});
