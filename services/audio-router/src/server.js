import express from 'express';

const app = express();
const PORT = process.env.AUDIO_ROUTER_PORT || 4002;

app.use(express.json());

app.post('/api/audio-router/policy', (req, res) => {
    const { roomId, targetUserId, allowList = [] } = req.body;
    res.json({
        ok: true,
        roomId,
        targetUserId,
        allowList
    });
});

app.get('/health', (req, res) => {
    res.json({ service: 'audio-router', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`audio-router running on http://localhost:${PORT}`);
});
