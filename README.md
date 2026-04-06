# Carpoolink

기 구축된 오프라인 중심 현직자 멘토링 매칭 플랫폼(이하 ‘카풀링’)을 온라인 실시간 소통형 멘토링으로 확장하기 위한 모노레포 프로젝트입니다.

## Monorepo 구조

```text
apps/
	demo-web/
services/
	mentoring-session/
	sfu-server/
	audio-router/
	live-chat/
	question-queue/
	voice-command/
	drm-guard/
packages/
	contracts/
	sdk-client/
	common/
docs/
	api/
	guides/
	architecture/
tests/
	integration/
	e2e/
	load/
```

## 실행

1. 루트에서 의존성 설치

    ```bash
    npm install
    ```

2. 기본 백엔드(mentoring-session) 실행

    ```bash
    npm run dev
    ```

3. 개별 서비스 실행 예시

    루트에 위치한 `package.json` scripts 목록 참고

    ```bash
    npm run dev:sfu
    npm run dev:live-chat
    npm run dev:question-queue
    ```