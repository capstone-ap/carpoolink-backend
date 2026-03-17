import express from 'express';

const app = express();
const PORT = process.env.SFU_PORT || 4001;

app.get('/health', (req, res) => {
    res.json({ service: 'sfu-server', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`sfu-server running on http://localhost:${PORT}`);
});
