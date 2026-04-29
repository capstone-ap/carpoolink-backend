import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeRedis, redisClient } from './redis/redisClient.js';
import { handleConnection } from './socket/socketHandler.js';
import chatsRouter from './routes/chats.js';
import { PrismaClient } from '@carpoolink/database';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.CHAT_SERVICE_PORT || 4001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Prisma 클라이언트를 전역에 할당
global.prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io 설정
const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

// 라우트 등록
app.use('/chats', chatsRouter);

// Health check 엔드포인트
app.get('/health', (req, res) => {
    res.json({ service: 'chat-service', status: 'ok' });
});

// Socket.io 연결 이벤트
io.on('connection', (socket) => {
    handleConnection(socket, io);
});

// Redis 클라이언트 초기화 및 서버 시작
async function startServer() {
    try {
        await initializeRedis();
        console.log('✓ Redis connected');

        httpServer.listen(PORT, () => {
            console.log(`✓ chat-service running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('✗ Failed to start chat-service:', error);
        process.exit(1);
    }
}

// 종료 이벤트 처리
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await redisClient.disconnect();
    await global.prisma.$disconnect();
    httpServer.close(() => {
        process.exit(0);
    });
});

startServer();

export { io, httpServer };
