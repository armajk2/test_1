import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';

// 환경 변수 로드
dotenv.config();

const app = express();

// CORS 설정
app.use(cors({
    origin: '*', // HTML 파일이 실행되는 주소 -> 실제 주소 입력
    credentials: true
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
