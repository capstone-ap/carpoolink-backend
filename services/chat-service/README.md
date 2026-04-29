# chat-service

실시간 멘토링 채팅 서비스입니다.

## Run

```bash
npm run dev -w services/chat-service
```

## 환경 변수

- `CHAT_SERVICE_PORT` (기본값: `4001`)
- `DATABASE_URL`
- `REDIS_URL` (기본값: `redis://localhost:6379`)
- `CORS_ORIGIN` (기본값: `http://localhost:3000`)

## 기능

- 멘토링 룸 단위 실시간 채팅(Socket.io)
- 메시지 영속화(`MentoringChat`)
- 메시지 조회/삭제 REST API

## API

### HTTP

- `GET /health`
- `POST /chats/:mentoringId/messages`
- `GET /chats/:mentoringId/messages?limit=&offset=`
- `GET /chats/:mentoringId/info`
- `DELETE /chats/:mentoringId/messages/:messageId`

### Socket Events

- Client -> Server: `join_chat`, `send_message`, `get_message_history`, `get_online_users`, `leave_chat`
- Server -> Client: `new_message`, `user_joined`, `user_left`, `message_history`, `online_users`

