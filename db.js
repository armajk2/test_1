import dotenv from 'dotenv';  // dotenv 모듈을 ESM 방식으로 가져오기
import { createClient } from '@supabase/supabase-js';

// 환경 변수 로드
dotenv.config();

// Supabase 클라이언트 생성
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log("✅ Supabase 연결 성공!");

// supabase 클라이언트 내보내기
export { supabase };
