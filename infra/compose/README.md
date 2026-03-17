# Compose

로컬 통합 실행용 docker compose 파일을 관리합니다.

## PostgreSQL 실행

프로젝트 루트에서 아래 명령으로 실행합니다.

```bash
docker compose --env-file .env -f infra/compose/docker-compose.yml up -d
```

중지 명령:

```bash
docker compose -f infra/compose/docker-compose.yml down
```
