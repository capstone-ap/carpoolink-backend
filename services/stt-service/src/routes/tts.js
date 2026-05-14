import { Router } from "express";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/*
POST /tts/speak
Content-Type: application/json
{ "text": "읽어 줄 질문 텍스트" }
audio/mpeg 스트림 변환
*/

router.post('/speak', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'text는 필수입니다.' });
    }

    const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: text,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
})

export default router;