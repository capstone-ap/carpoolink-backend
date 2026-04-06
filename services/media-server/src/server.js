import express from 'express';

const app = express();
const PORT = process.env.MEDIA_SERVER_PORT || 4002;

app.get('/health', (req, res) => {
    res.json({ service: 'media-server', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`media-server running on http://localhost:${PORT}`);
});
