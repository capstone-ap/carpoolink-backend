# Data Directory Guide

## Overview
이 디렉토리는 캡스톤 프로젝트의 데이터 자산을 관리하기 위한 공간이다.

- `raw/`: 원본 데이터 보관
- `interim/`: 전처리 및 정규화 중간 산출물
- `processed/`: 학습 및 실험에 바로 사용할 최종 데이터

원칙적으로 원본 데이터는 `raw/`에서 직접 수정하지 않는다.
필요한 변환은 `interim/`, 최종 산출은 `processed/`에서 관리한다.

---

## Current Raw Datasets

### 1. kor_3i4k
- 경로: `raw/3i4k/kor_3i4k/`
- 용도: 질문/대화 표현 패턴 분석 및 질문 탐지 보조 데이터로 활용 가능
- 비고: Hugging Face 계열 분할 파일(`train`, `test`) 구조 유지

### 2. AIHub Online Spoken
- 경로: `raw/aihub_online_spoken.../`
- 포함 구조:
  - `라벨링데이터/`
  - `원천데이터/`
- 용도: 온라인 발화/구어체 표현 학습, 질문 탐지 후보 데이터
- 비고: AIHub 원본 구조 유지

### 3. AIHub SNS Multiturn
- 경로: `raw/aihub_sns_multiturn.../`
- 포함 구조:
  - `Other/`
  - `SubLabel/`
  - `Training/01.원천데이터`
  - `Training/02.라벨링데이터`
  - `Validation/`
- 용도: SNS 기반 멀티턴 대화 데이터, 질문 탐지 및 대화 맥락 분석용
- 비고: AIHub 원본 폴더 구조 유지

---

## Rules

1. `raw/` 데이터는 원칙적으로 수정하지 않는다.
2. 원본 압축 해제, 포맷 통일, 샘플링, 병합은 `interim/`에서 수행한다.
3. 모델 학습에 직접 사용하는 최종 파일은 `processed/`에 저장한다.
4. 대용량 데이터는 Git에 직접 올리지 않고 DVC로 관리한다.
5. 각 데이터셋의 출처와 라이선스는 별도 문서로 기록한다.

---

## Recommended Next Outputs

향후 아래와 같은 파일이 `processed/`에 생성될 수 있다.

- `question_detection_train.csv`
- `question_detection_valid.csv`
- `question_detection_test.csv`
- `question_ranking_candidates.jsonl`

---

## Notes
- 현재 `raw/`는 DVC로 추적한다.
- Git에는 실제 원본 데이터가 아니라 `.dvc` 메타파일과 문서만 반영한다.