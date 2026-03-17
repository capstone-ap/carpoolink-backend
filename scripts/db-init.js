import { initializeDatabase } from '../packages/common/src/database.js';

console.log('starting database initialization...');

// 데이터베이스 초기화 실행
initializeDatabase()
    .then(() => {
        console.log('complete database initialization');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error occurred during database initialization:', err);
        process.exit(1);
    });