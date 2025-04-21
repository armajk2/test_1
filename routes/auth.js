import express from "express";
import { supabase } from '../db.js';  // db.js에서 supabase 클라이언트 import
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// 인증 미들웨어
export const auth = async (req, res, next) => {
    try {
        // 토큰 가져오기
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
        }

        // Supabase로 사용자 인증
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
        }

        // 인증된 사용자 정보를 요청 객체에 추가
        req.user = {
            id: user.id,
            email: user.email,
        };
        next();
    } catch (error) {
        console.error('인증 미들웨어 오류:', error);
        res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
    }
};

// 연결 테스트 라우트 수정
router.get('/test-connection', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        if (error) {
            console.error('Supabase 연결 오류:', error);
            return res.status(500).json({ message: 'Supabase 연결 실패', error: error.message });
        }
        res.json({ message: 'Supabase 연결 성공', data });
    } catch (error) {
        console.error('연결 테스트 중 오류:', error);
        res.status(500).json({ message: '서버 오류', error: error.message });
    }
});

// 회원가입 라우트
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('회원가입 요청 받음:', { 
            email,
            headers: req.headers,
            body: req.body
        });
        
        if (!email || !password) {
            return res.status(400).json({ message: '이메일과 비밀번호를 모두 입력해주세요.' });
        }

        // Supabase 회원가입 시도
        console.log('Supabase 회원가입 시도...');
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `http://wudl.netlify.app/confirm.html`
            }
        });


        if (error) {
            console.error('Supabase 회원가입 오류:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                status: error.status
            });
            return res.status(400).json({ 
                message: error.message,
                details: error.details,
                hint: error.hint
            });
        }

        console.log('회원가입 성공:', data);
        res.status(201).json({
            message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
            user: data.user
        });
    } catch (error) {
        console.error('회원가입 처리 중 예외:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 로그인 라우트
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // console.log('로그인 시도:', { email });
        
        if (!email || !password) {
            return res.status(400).json({ message: '이메일과 비밀번호를 모두 입력해주세요.' });
        }

        // Supabase 로그인 시도
        // console.log('Supabase 로그인 시도...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Supabase 로그인 오류:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                status: error.status
            });
            return res.status(400).json({ 
                message: error.message,
                details: error.details,
                hint: error.hint
            });
        }

        // 이메일 인증 확인
        if (!data.user.email_verified && !data.user.email_confirmed_at) {
            return res.status(400).json({ message: '이메일 인증을 완료해야 로그인할 수 있습니다. 메일을 확인해주세요!' });
        }
        

        // users 테이블에서 사용자 정보 가져오기
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('user_id', data.user.id)
            .single();

        if (userError) {
            console.error('사용자 정보 조회 오류:', userError);
        }

        // 로그인 성공 시 토큰과 사용자 정보 반환
        res.json({
            token: data.session.access_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                username: userData?.username || data.user.email.split('@')[0],
                avatar_url: userData?.avatar_url
            }
        });
    } catch (error) {
        console.error('로그인 처리 중 예외:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 로그아웃 라우트
router.post('/logout', auth, async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.json({ message: '로그아웃되었습니다.' });
    } catch (error) {
        console.error('로그아웃 오류:', error);
        res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
    }
});

// 프로필 업데이트 (이미지와 사용자 정보)
router.post('/profile/update', auth, async (req, res) => {
    try {
        const { file_data, username, bio } = req.body;
        const userId = req.user.id;
        let avatar_url = null;

        // 이미지가 제공된 경우 업로드
        if (file_data) {
            // base64 데이터를 파일로 변환
            const base64Data = file_data.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // 파일 이름 생성
            const fileExt = file_data.split(';')[0].split('/')[1];
            const fileName = `${userId}_${Date.now()}.${fileExt}`;

            // Supabase Storage에 업로드
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, buffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 이미지 URL 가져오기
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
            
            avatar_url = publicUrl;
        }

        // 사용자 프로필 업데이트
        const updateData = {};
        if (avatar_url) updateData.avatar_url = avatar_url;
        if (username) updateData.username = username;
        if (bio) updateData.bio = bio;

        const { data: userData, error: userError } = await supabase
            .from('users')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (userError) throw userError;

        res.json({ 
            message: '프로필이 업데이트되었습니다.',
            avatar_url: avatar_url,
            username: username,
            bio: bio,
            user: userData
        });
    } catch (error) {
        console.error('프로필 업데이트 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 프로필 조회 엔드포인트
router.get('/profile', auth, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;

        res.json({
            id: user.user_id,
            email: user.email,
            username: user.username,
            avatar_url: user.avatar_url,
            bio: user.bio
        });
    } catch (error) {
        console.error('프로필 조회 오류:', error);
        res.status(500).json({ message: '프로필 조회 중 오류가 발생했습니다.' });
    }
});

router.get('/:userId', auth, async (req, res) => {
    const targetUserId = req.params.userId;
    
    try {
        // 1. 사용자 정보 조회
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('bio, avatar_url')
            .eq('user_id', targetUserId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
        }

        res.json({
            bio: user.bio,
            avatar_url: user.avatar_url,
        });

    } catch (error) {
        console.error('유저 프로필 조회 오류:', error);
        res.status(500).json({ message: '유저 프로필을 불러오는 중 오류가 발생했습니다.' });
    }
});


export default router;