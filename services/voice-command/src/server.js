import express from 'express';

const app = express();
const PORT = process.env.VOICE_COMMAND_PORT || 4005;

app.use(express.json());

app.post('/api/voice-command/events', (req, res) => {
    const { mentorId, transcript } = req.body;
    const normalized = String(transcript || '').toLowerCase();

    let action = 'NONE';
    if (normalized.includes('next question')) action = 'NEXT_QUESTION';
    if (normalized.includes('voice mode')) action = 'SWITCH_VOICE_MODE';

    res.json({
        mentorId,
        transcript,
        action
    });
});

app.get('/health', (req, res) => {
    res.json({ service: 'voice-command', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`voice-command running on http://localhost:${PORT}`);
});
