import { Router } from 'express';
import { broadcastQuestionEvent } from '../lib/socketHub.js';

const router = Router();

function isAllowedEvent(event) {
    return ['question:registered', 'question:acknowledged', 'question:completed'].includes(event);
}

router.post('/events', (req, res) => {
    const mentoringId = req.body?.mentoringId;
    const event = req.body?.event;
    const payload = req.body?.payload ?? {};

    if (!mentoringId || !event || !isAllowedEvent(event)) {
        return res.status(400).json({
            ok: false,
            message: '유효하지 않은 질문 이벤트입니다.',
        });
    }

    const broadcasted = broadcastQuestionEvent(mentoringId, event, payload);
    if (!broadcasted) {
        return res.status(503).json({
            ok: false,
            message: 'Socket 서버가 아직 준비되지 않았습니다.',
        });
    }

    return res.json({
        ok: true,
    });
});

export default router;