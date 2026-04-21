# Issue #2 Checklist Status

Issue: [질문 탐지 모듈 사전 준비: 데이터셋 구축 및 규칙 기반 전처리 설계 #2](https://github.com/capstone-ap/carpoolink/issues/2)

## 1. 데이터 준비

- 질문 탐지용 데이터 수집
  - 상태: 진행됨
  - 근거:
    - [build_question_detection_dataset.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/build_question_detection_dataset.py)
    - [clean_aihub_sns_multiturn.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/clean_aihub_sns_multiturn.py)
    - [preprocess_aihub_sns_multiturn.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/preprocess_aihub_sns_multiturn.py)
  - 설명:
    - AI Hub SNS 멀티턴 계열 데이터를 정리해 질문 탐지용 데이터셋 빌드 흐름이 마련되어 있다.

- 실시간 채팅 형식에 맞는 데이터 포맷 정리
  - 상태: 진행됨
  - 근거:
    - [preprocess_question_detection_for_tfidf.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/preprocess_question_detection_for_tfidf.py)
  - 설명:
    - 실시간 채팅체를 고려해 URL, 이메일, 반복 문자, 공백, 특수문자를 정리하는 입력 포맷이 정리되어 있다.

- 질문 / 비질문 라벨링 기준 정의
  - 상태: 일부 진행
  - 근거:
    - 현재 스크립트들에는 `label=1` 질문, `label=0` 비질문 전제가 반영되어 있다.
  - 설명:
    - 코드상 기준은 반영되어 있으나, 문서형 라벨링 가이드라인은 별도 정리하면 더 좋다.

- 데이터 라벨링
  - 상태: 진행됨
  - 근거:
    - [train.csv](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/data/processed/question_detection/train.csv:1)
    - [valid.csv](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/data/processed/question_detection/valid.csv:1)
    - [test.csv](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/data/processed/question_detection/test.csv:1)
  - 설명:
    - 이미 학습/검증/테스트용 라벨 데이터가 존재하고 실험에 사용되고 있다.

- 학습용 / 검증용 / 테스트용 데이터 분리
  - 상태: 완료
  - 근거:
    - [split_question_detection_dataset.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/split_question_detection_dataset.py)
    - [data/processed/question_detection](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/data/processed/question_detection)
  - 설명:
    - train/valid/test 분할이 완료되어 있고 TF-IDF 준비 데이터도 별도로 존재한다.

## 2. 규칙 기반 전처리

- 문장 정제 규칙 정의
  - 상태: 완료
  - 근거:
    - [preprocess_question_detection_for_tfidf.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/preprocess_question_detection_for_tfidf.py:47)
  - 설명:
    - 기본 정제 로직이 함수로 분리되어 있어 재사용 가능하다.

- 공백, 반복 문자, 특수문자, 이모지 처리 방식 정리
  - 상태: 완료
  - 근거:
    - [preprocess_question_detection_for_tfidf.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/preprocess_question_detection_for_tfidf.py:47)
  - 설명:
    - 반복 문자 축약, 공백 정리, 일부 특수문자 제거가 구현되어 있다.

- 채팅체 및 축약 표현 정규화 방식 정리
  - 상태: 진행됨
  - 근거:
    - [question_detection_rules.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/question_detection_rules.py:1)
  - 설명:
    - `머임`, `뭥미`, `레알`, `ㄹㅇ` 같은 채팅체 신호가 규칙에 반영되어 있다.
    - 다만 축약어 사전형 치환은 아직 제한적이므로 KC-ELECTRA 학습과 함께 더 보강 가능하다.

- 질문 후보 선별용 규칙 정의
  - 상태: 완료
  - 근거:
    - [question_detection_rules.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/question_detection_rules.py:7)
  - 설명:
    - 질문 어휘, 질문 종결형, 요청형, 채팅체 질문형, 반응문 패턴이 규칙화되어 있다.

- 규칙 기반 1차 전처리 로직 초안 작성
  - 상태: 완료
  - 근거:
    - [train_tfidf_question_detector_with_threshold.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/train_tfidf_question_detector_with_threshold.py:237)
    - [compare_question_detector_variants.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/compare_question_detector_variants.py:1)
    - [analyze_question_detection_errors.py](/C:/Users/admin/Desktop/2026%20캡스톤디자인/Capstone/carpoolink/services/question-service/scripts/analyze_question_detection_errors.py:51)
  - 설명:
    - 규칙 필터 적용 여부를 실험할 수 있고, 에러 분석까지 연결된다.

## 현재 판단

- Issue #2의 핵심 범위는 대부분 구현되어 있다.
- 남은 큰 작업은 아래 두 가지다.
- 1. KC-ELECTRA 기반 정밀 분류기 학습 및 저장
- 2. 실시간 서비스용 하이브리드 파이프라인 연결

## 권장 다음 단계

- 규칙을 `강한 질문 신호 승격` 중심으로만 사용한다.
- 값싼 1차 모델(TF-IDF)로 대부분 처리한다.
- threshold 근처의 애매한 샘플이나 규칙/모델 충돌 샘플만 KC-ELECTRA로 보낸다.
