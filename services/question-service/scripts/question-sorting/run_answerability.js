import { computeAnswerability } from './calculator.js';

// CLI에서 직접 실행할 때 사용
// 사용법: node scripts/question-sorting/run_answerability.js '<JSON>'
//
// 예시:
// node scripts/question-sorting/run_answerability.js '{
//   "question": "3년차 백엔드 개발자인데 포트폴리오 어떻게 하면 될까요?",
//   "isPaid": false,
//   "sessionTopic": "개발자 이직",
//   "recentMentorUtterances": ["포트폴리오는 프로젝트 위주로"],
//   "mentorProfile": "5년차 백엔드 엔지니어",
//   "mentorPastScripts": []
// }'

const raw = process.argv[2];

if (!raw) {
  console.error('입력 JSON을 첫 번째 인자로 전달해주세요.');
  process.exit(1);
}

const input = JSON.parse(raw);
const result = await computeAnswerability(input);
console.log(JSON.stringify(result, null, 2));
