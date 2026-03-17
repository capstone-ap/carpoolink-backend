import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// 데이터베이스 연결 풀 설정
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10,
    idleTimeoutMillis: 30000
});

// 데이터베이스 연결 테스트 및 초기화 함수
async function verifyConnection() {
    const client = await pool.connect();
    try {
        await client.query('SELECT 1');
        console.log('PostgreSQL connection established.');
    } finally {
        client.release();
    }
}

// 테이블 생성 함수
async function createUserTable() {
    // users 테이블 생성
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id BIGSERIAL PRIMARY KEY,
      nickname VARCHAR(50) NOT NULL UNIQUE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('mentor', 'mentee')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

    // updated_at 자동 갱신 트리거 및 함수 생성
    await pool.query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

    // 트리거가 이미 존재하는지 확인 후 생성
    await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_users_set_updated_at'
      ) THEN
        CREATE TRIGGER trg_users_set_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);
}

// 시드 데이터 삽입 함수
async function seedUsersIfEmpty() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    const count = rows[0]?.count ?? 0;

    // 테이블이 비어있을 때만 시드 데이터 삽입
    if (count > 0) {
        console.log('Seed skipped: users table already has data.');
        return;
    }

    // 시드 데이터 삽입
    await pool.query(
        `
      INSERT INTO users (nickname, role)
      VALUES
        ($1, $2),
        ($3, $4),
        ($5, $6),
        ($7, $8)
    `,
        [
            'mentor_kim', 'mentor',
            'mentor_mina', 'mentor',
            'mentee_haeun', 'mentee',
            'mentee_dongho', 'mentee'
        ]
    );

    console.log('Seed completed: mock users inserted.');
}

// 외부에서 호출할 함수
export async function initializeDatabase() {
    await verifyConnection();
    await createUserTable();
    await seedUsersIfEmpty();
}

export { pool };
