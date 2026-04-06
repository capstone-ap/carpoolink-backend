import express from 'express';

const app = express();
const PORT = process.env.CHAT_SERVICE_PORT || 4001;

app.get('/health', (req, res) => {
    res.json({ service: 'chat-service', status: 'ok' });
});

httpServer.listen(PORT, () => {
    console.log(`chat-service running on http://localhost:${PORT}`);
});
