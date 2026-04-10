# core-api

사용자 관리, 사전 설문, 멘토링 생성/종료 등 어플리케이션의 전반적인 기능을 지원하는 메인 서버입니다.

## Run

```bash
npm run dev -w services/core-api
```

## Request Header

- `x-user-id`: 사용자 ID

## Main Routes

- `GET /health`
- `GET /survey/config`
- `POST /survey/results`
- `GET /users/exists`
- `GET /users/me`
- `GET /mentors`
- `GET /mentors/:mentorId`
- `GET /mentorings/group`
- `GET /mentorings/one-on-one/peers`
- `GET /scripts`
- `GET /scripts/participated`
