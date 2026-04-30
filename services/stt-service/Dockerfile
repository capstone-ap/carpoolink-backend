# 1단계: 빌드
FROM node:20-alpine AS build

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# 2단계: 실행
FROM node:20-alpine
WORKDIR /app

# FFmpeg 설치 (fluent-ffmpeg 필요)
RUN apk add --no-cache ffmpeg

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 빌드 결과물 복사
COPY --from=build /app /app

EXPOSE 4004

CMD ["npm", "start"]
