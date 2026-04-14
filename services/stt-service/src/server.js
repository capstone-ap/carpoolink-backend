import 'dotenv/config'
import express from 'express';
import sttRouter from './routes/stt.js'

const app = express();
const PORT = process.env.STT_SERVICE_PORT || 4004;

app.use(express.json());
app.use("/stt", sttRouter);

app.get('/health', (req, res) => {
    res.json({ service: 'stt-service', status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`stt-service running on http://localhost:${PORT}`);
});
