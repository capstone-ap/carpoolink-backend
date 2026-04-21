# Question Detector Variant Comparison

## Issue #2 Status

- 데이터 수집/정리/분할 스크립트는 존재한다.
- 채팅체 정규화와 TF-IDF 입력 전처리 스크립트가 존재한다.
- 질문 후보 선별 규칙 초안은 공용 규칙 모듈로 정리되었다.
- 남은 작업은 규칙 기반과 모델 기반을 함께 비교해 실제 추론 전략을 결정하는 것이다.

## Test Metrics

- tfidf_lr_rule_filter_on: precision=0.2222, recall=0.8771, f1=0.3545, accuracy=0.8314, threshold=0.25
- tfidf_lr_rule_filter_off: precision=0.6655, recall=0.6088, f1=0.6359, accuracy=0.9632, threshold=0.30

## Winner

- Best test variant by f1: tfidf_lr_rule_filter_off (f1=0.6359, precision=0.6655, recall=0.6088)
