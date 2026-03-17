import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

const PORT = process.env.LIVE_CHAT_PORT || 4003;

io.on('connection', (socket) => {
    socket.on('chat:message', (payload) => {
        io.emit('chat:message', payload);
    });

    socket.on('chat:superchat', (payload) => {
        io.emit('chat:superchat', payload);
    });
});

app.get('/health', (req, res) => {
    res.json({ service: 'live-chat', status: 'ok' });
});

httpServer.listen(PORT, () => {
    console.log(`live-chat running on http://localhost:${PORT}`);
});
