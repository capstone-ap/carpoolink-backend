import { Router } from "express";
import multer from "multer";
import { transcribeAudio } from "../services/whisper.js";
import { saveScript } from "../services/scriptSave.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // 파일을 메모리에 임시 저장

/*
POST /stt/chunk
multipart/form-data:
    - audio: 오디오 파일 (wav, mp3 등)
    - userId: string
    - mentoringId: string
    - chunkIndex: string (숫자)
    - startTime?: string (초 단위, 선택)
    - endTime?: string (초 단위, 선택)
*/
router.post("/chunk", upload.single("audio"), async (req, res) => {
  try {
    const { userId, mentoringId, chunkIndex, startTime, endTime } = req.body;

    // 필수값 체크
    if (!req.file || !userId || !mentoringId || chunkIndex === undefined) {
      return res.status(400).json({ error: "audio, userId, mentoringId, chunkIndex는 필수입니다." });
    }

    // multer 메모리 버퍼 → Whisper가 읽을 수 있는 File 객체로 변환
    const audioFile = new File(
      [req.file.buffer],
      req.file.originalname || `chunk_${chunkIndex}.wav`,
      { type: req.file.mimetype }
    );

    // 1. Whisper STT
    const text = await transcribeAudio(audioFile);

    // 2. DB 저장
    const saved = await saveScript(
      {
        text,
        chunkIndex: parseInt(chunkIndex),
        startTime: startTime ? parseFloat(startTime) : undefined,
        endTime: endTime ? parseFloat(endTime) : undefined,
      },
      {
        userId,
        mentoringId,
      }
    );

    res.json({
      scriptId: saved.scriptId.toString(),
      text,
      chunkIndex: parseInt(chunkIndex),
    });
  } catch (err) {
    console.error("[STT ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;