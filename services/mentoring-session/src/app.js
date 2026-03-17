import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Test Route
app.get('/', (req, res) => {
    res.json({ message: '2026 Capstone AP - Carpoolink' });
});

// Mentoring session API skeleton
app.post('/api/mentoring/voice/switch', (req, res) => {
    const { roomId, mentorId, menteeId } = req.body;
    res.json({
        ok: true,
        roomId,
        mentorId,
        menteeId,
        mode: 'voice',
        message: 'chat-to-voice request accepted'
    });
});

app.post('/api/mentoring/voice/answer-visibility', (req, res) => {
    const { questionId, visibility } = req.body;
    res.json({
        ok: true,
        questionId,
        visibility: visibility || 'public'
    });
});

export default app;