# chat-service

실시간 멘토링 채팅 서비스입니다.

## Run

```bash
npm run dev -w services/chat-service
```

## 환경 변수

- `CHAT_SERVICE_PORT` (기본값: `4001`)
- `DATABASE_URL`
- `CORS_ORIGIN` (기본값: `http://localhost:3000`)

## 기능

- 멘토링 룸 단위 실시간 채팅(Socket.io, 단일 서버)
- 메시지 영속화(`MentoringChat`)
- ON_AIR 상태 멘토링만 채팅 입장/사용 가능
- 멘토링 COMPLETED 전환 감지 시 채팅룸 자동 종료

## API

모든 경로 앞에 `/chat` 혹은 `/chat/socket.io`를 붙여 사용합니다.

### HTTP

- `GET /health`
    
    서버 상태 확인
- `GET /chats/:mentoringId/messages?limit=&offset=`
    
    메시지 내역 조회: 실시간 조회가 느린 경우에 사용할 수 있음
- `GET /chats/:mentoringId/info`
    
    채팅룸 정보 조회: 멘토링 정보와 채팅 개수

### Socket Events

- Client -> Server: `join_chat`, `send_message`, `get_message_history`, `get_online_users`, `leave_chat`
- Server -> Client: `new_message`, `user_joined`, `user_left`, `message_history`, `online_users`, `room_closed`

### Internal API (core-api 간 통신)

#### 질문 이벤트 수신

- `POST /internal/questions/events`: core-api에서 질문 상태 변경 시 호출됩니다.
  - 요청 본문:
    ```json
    {
        "mentoringId": "123456",
        "event": "question:registered" | "question:acknowledged" | "question:completed",
        "payload": {
            "question": { /* 질문 정보 */ }
        }
    }
    ```
  - 이벤트 수신 후 Socket.io를 통해 멘토링 룸의 클라이언트들에게 실시간으로 브로드캐스트됩니다.

