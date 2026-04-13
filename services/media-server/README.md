# sfu-server

1:N, 1:1에서 사용될 mediasoup 기반 SFU 기능을 지원하는 서비스입니다.

현재 구현은 1:N 온라인 멘토링 시나리오를 우선 지원합니다.

- 멘토가 멘토링 시작 시 `mentorings` 레코드 생성
- 멘티는 WebSocket 시그널링으로 입장 후 멘토의 비디오/오디오를 consume
- 멘티는 채팅 기반 참여를 전제로 미디어 produce 제한
- 오디오 파이프라인 확장 지점 제공(STT, 저장, TTS 믹싱)

## Run

```bash
npm run dev -w services/media-server
```

## HTTP API

### `GET /health`

서비스 상태 및 mediasoup worker 상태를 확인합니다.

### `POST /mentorings/start`

멘토링 세션을 시작합니다. DB(Prisma) 연결이 가능하면 `mentorings` 테이블에 레코드를 생성합니다.
DB 연결이 불가하면 in-memory 저장소로 fallback 합니다.
반환된 mentoringId로 이후 동작을 수행합니다.

Request example:

```json
{
	"title": "프론트엔드 커리어 멘토링",
	"userId": 1,
	"isGroup": true
}
```

### `POST /mentorings/:mentoringId/end`

멘토링 종료 및 SFU room 정리를 수행합니다.

### `GET /mentorings/:mentoringId`

멘토링 메타데이터 + 현재 미디어 룸 스냅샷을 조회합니다.

## WebSocket Signaling

Endpoint: `/ws`

메시지 포맷:

```json
{
	"requestId": "optional-correlation-id",
	"action": "joinMentoring",
	"data": {}
}
```

응답 포맷:

```json
{
	"requestId": "same-id",
	"ok": true,
	"data": {}
}
```

주요 action:

- `joinMentoring`: `{ mentoringId, role, peerId? }`
	- role: `mentor` | `mentee` | `tts-bot`
- `createWebRtcTransport`: `{ direction: "send" | "recv" }`
- `connectWebRtcTransport`: `{ transportId, dtlsParameters }`
- `produce`: `{ transportId, kind, rtpParameters, appData }`
- `consume`: `{ transportId, producerId, rtpCapabilities }`
- `resumeConsumer`: `{ consumerId }`
- `listProducers`: `{}`
- `ttsEnqueue`: `{ text, metadata? }`
- `leaveMentoring`: `{}`

서버 event:

- `peer-joined`
- `peer-left`
- `new-producer`

## 역할 제약(1:N)

- `mentor`: 오디오/비디오 produce 가능 (방당 1명)
- `mentee`: produce 불가, consume만 가능
- `tts-bot`: 오디오만 produce 가능

## 오디오 저장/스크립트 확장 포인트

`src/streaming/audioPipeline.js`에 확장 지점이 있습니다.

- `attachMentorAudioProducer`: 멘토 음성 트랙 연결 시점
- `attachTtsAudioProducer`: TTS 음성 트랙 연결 시점
- `notifyAudioCompositeChange`: 멘토 음성 + TTS 음성의 합성 계획 갱신

이 지점에서 다음 구현을 붙일 수 있습니다.

- RTP를 FFmpeg/GStreamer로 포워딩하여 단일 오디오 트랙 믹싱
- 믹싱 결과를 S3 등 오브젝트 스토리지로 업로드
- 실시간 STT 서비스로 스트리밍 전송하여 스크립트 생성

즉, 현재 코드는 실시간 방송(mentor -> mentees) 중심으로 동작하며,
오디오 저장/STT/TTS 믹싱은 어댑터만 추가하면 확장할 수 있도록 구성되어 있습니다.
