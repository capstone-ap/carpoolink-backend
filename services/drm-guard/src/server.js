import express from 'express';

const app = express();
const PORT = process.env.DRM_GUARD_PORT || 4006;

app.use(express.json());

app.post('/api/drm/session-token', (req, res) => {
    const { streamId, userId } = req.body;
    res.json({
        streamId,
        userId,
        drmProvider: 'EME',
        token: `drm_${Date.now()}`
    });
});

app.get('/health', (req, res) => {
    res.json({ service: 'drm-guard', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`drm-guard running on http://localhost:${PORT}`);
});
