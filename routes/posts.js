import express from 'express';
import { supabase } from '../db.js';  // db.js에서 supabase 클라이언트 import
import dotenv from 'dotenv';
import { auth } from './auth.js';

dotenv.config();

const router = express.Router();

// 모든 요청에 대한 로깅
router.use((req, res, next) => {
    // console.log('요청 경로:', req.originalUrl);
    // console.log('요청 메소드:', req.method);
    // console.log('요청 파라미터:', req.params);
    next();
});

// UUID 형식 검증 함수 추가
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// 게시물 작성
router.post('/', auth, async (req, res) => {
    try {
        const { content, images, category } = req.body;
        const { data, error } = await supabase
            .from('posts')
            .insert([{
                author_id: req.user.id,
                content,
                images,
                category
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('게시물 작성 오류:', error);
        res.status(500).json({ message: error.message });
    }
});

// 모든 게시물 조회 (페이지네이션 포함)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query; // 카테고리 필터링을 위한 쿼리 가져오기

        // 기본 쿼리 작성
        let query = supabase
            .from('posts')
            .select(`
                *,
                author:users!inner (
                    user_id,
                    username
                ),
                likes:post_likes(count),
                comments:post_comments(count),
                archives:post_archives(count)
            `)
            .order('created_at', { ascending: false });

        // 카테고리 필터링 적용
        if (category) {
            query = query.eq('category', category);
        }

        // 데이터 조회
        const { data: posts, error, count } = await query;
        if (error) throw error;

        // 응답 데이터 가공
        const formattedPosts = posts.map(post => ({
            ...post,
            likes_count: post.likes?.[0]?.count || 0,
            comments_count: post.comments?.[0]?.count || 0,
            archives_count: post.archives?.[0]?.count || 0
        }));

        // 최종 응답 반환 (중복된 res.json 제거)
        res.json({
            data: formattedPosts,
            total: count
        });

    } catch (error) {
        res.status(500).json({
            message: '게시물을 불러오는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});


// 저장된 게시물 조회 엔드포인트 - 정적 라우트를 동적 라우트보다 먼저 배치
router.get('/archived', auth, async (req, res) => {
    try {
        console.log('백엔드: /archived 요청 받음');
        console.log('백엔드: 사용자 ID:', req.user.id);

        // 사용자가 저장한 게시물 ID 목록 가져오기
        const { data: archivedPosts, error: archiveError } = await supabase
            .from('post_archives')
            .select('post_id')
            .eq('user_id', req.user.id);

        console.log('백엔드: 저장된 게시물 ID 목록:', archivedPosts);

        if (archiveError) {
            console.error('백엔드: 저장된 게시물 조회 에러:', archiveError);
            throw archiveError;
        }

        const postIds = archivedPosts.map(post => post.post_id);
        console.log('백엔드: 추출된 게시물 ID:', postIds);

        if (postIds.length === 0) {
            console.log('백엔드: 저장된 게시물 없음');
            return res.json({ data: [] });
        }

        // 저장된 게시물의 상세 정보 가져오기
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(`
                post_id,
                content,
                created_at,
                author:users!inner (user_id, username),
                likes:post_likes(count),
                comments:post_comments(count),
                archives:post_archives(count)
            `)
            .in('post_id', postIds)
            .order('created_at', { ascending: false });

        console.log('백엔드: 게시물 상세 정보 조회 결과:', posts);

        if (postsError) {
            console.error('백엔드: 게시물 상세 정보 조회 에러:', postsError);
            throw postsError;
        }

        const formattedPosts = posts.map(post => ({
            post_id: post.post_id,
            content: post.content,
            created_at: post.created_at,
            author: post.author,
            likes_count: post.likes[0]?.count || 0,
            comments_count: post.comments[0]?.count || 0,
            archives_count: post.archives[0]?.count || 0
        }));

        console.log('백엔드: 응답 데이터:', formattedPosts);
        res.json({ data: formattedPosts });
    } catch (error) {
        console.error('백엔드: 전체 에러:', error);
        res.status(500).json({ error: error.message });
    }
});

//trending 라우트
router.get('/trending', async (req, res) => {
    try {
        console.log('🔵 RPC 호출 시작');
        const { data, error } = await supabase.rpc('get_trending_posts');
        console.log('🔵 RPC 결과:', { data, error });
        if (error) {
            console.error('🔴 RPC 에러 전체:', error);
            return res.status(500).json({ error: error.message });
        }
        res.json({ data: data || [] });
    } catch (e) {
        console.error('🔴 서버 예외 발생:', e);
        return res.status(500).json({ error: '서버 내부 오류', details: e.message });
    }
});

// search route
router.get('/search', async (req, res) => {
    const { keyword } = req.query;

    if (!keyword) {
        return res.status(400).json({ message: '검색어를 입력해주세요.' });
    }

    const { data, error } = await supabase
        .rpc('search_posts', { keyword });

    if (error) {
        console.error('검색 오류:', error);
        return res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
    }

    res.json(data);
});

// 사용자가 작성한 글을 가져오는 API
router.get('/my-posts', auth, async (req, res) => {
    try {
        const user_id = req.user.id; // 로그인한 사용자의 id

        console.log('My Posts 요청 - 사용자 정보:', {
            user: req.user,
            user_id: user_id
        });

        // 사용자가 작성한 글만 가져오기
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:users!inner (
                    user_id,
                    username
                ),
                likes:post_likes(count),
                comments:post_comments(count),
                archives:post_archives(count)
            `)
            .eq('author_id', user_id) // 사용자가 작성한 글만 필터링
            .order('created_at', { ascending: false }); // 최신 글 순으로 정렬

        if (error) {
            console.error('My Posts 조회 에러:', error);
            throw error;
        }

        console.log('My Posts 조회 결과:', data);

        // 좋아요, 댓글, 아카이브 수 계산
        const postsWithCounts = data.map(post => ({
            ...post,
            likes_count: post.likes[0]?.count || 0,
            comments_count: post.comments[0]?.count || 0,
            archives_count: post.archives[0]?.count || 0
        }));

        // 성공적으로 가져온 글 반환
        res.json({ data: postsWithCounts });
    } catch (error) {
        console.error('My Posts 전체 에러:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/my-comments', auth, async (req, res) => {
    try {
        const user_id = req.user.id; // 로그인한 사용자의 id

        console.log('My Comments 요청 - 사용자 정보:', {
            user: req.user,
            user_id: user_id
        });

        // 사용자가 작성한 댓글과 해당 게시물 정보를 함께 가져오기
        const { data, error } = await supabase
            .from('post_comments')
            .select(`
                *,
                post:posts (
                    *,
                    author:users!inner (
                        user_id,
                        username
                    ),
                    likes:post_likes(count),
                    comments:post_comments(count),
                    archives:post_archives(count)
                )
            `)
            .eq('author_id', user_id) // 사용자가 작성한 댓글만 필터링
            .order('created_at', { ascending: false }); // 최신 댓글 순으로 정렬

        if (error) {
            console.error('My Comments 조회 에러:', error);
            throw error;
        }

        console.log('My Comments 조회 결과:', data);

        // 댓글이 달린 게시물 정보 가공
        const commentsWithPosts = data.map(comment => {
            const post = comment.post;
            return {
                comment_id: comment.comment_id,
                comment_content: comment.content,
                comment_created_at: comment.created_at,
                post: {
                    ...post,
                    likes_count: post.likes[0]?.count || 0,
                    comments_count: post.comments[0]?.count || 0,
                    archives_count: post.archives[0]?.count || 0
                }
            };
        });

        // 성공적으로 가져온 댓글 반환
        res.json({ data: commentsWithPosts });
    } catch (error) {
        console.error('My Comments 전체 에러:', error);
        res.status(500).json({ error: error.message });
    }
});


// 정적 라우트 이후에 동적 라우트 배치

// 게시물 수정
router.put('/:post_id', auth, async (req, res) => {
    try {
        const { content, category } = req.body;
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('post_id', req.params.post_id)
            .eq('author_id', req.user.id)
            .single();

        if (fetchError) throw fetchError;
        if (!post) {
            return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
        }

        const { data, error: updateError } = await supabase
            .from('posts')
            .update({ content, category })
            .eq('post_id', req.params.post_id)
            .eq('author_id', req.user.id)
            .select()
            .single();

        if (updateError) throw updateError;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 게시물 삭제
router.delete('/:post_id', auth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('post_id', req.params.post_id)
            .eq('author_id', req.user.id);

        if (error) throw error;
        res.json({ message: '게시물이 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 좋아요 추가/제거
router.post('/:post_id/like', auth, async (req, res) => {
    try {
        const postId = req.params.post_id;
        const userId = req.user.id;

        // users 테이블에서 user_id를 가져옵니다
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_id')
            .eq('user_id', userId)
            .single();

        if (userError) throw userError;

        // 이미 좋아요를 눌렀는지 확인
        const { data: existingLike, error: likeCheckError } = await supabase
            .from('post_likes')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', userData.user_id)
            .single();

        if (likeCheckError && likeCheckError.code !== 'PGRST116') {
            throw likeCheckError;
        }

        if (existingLike) {
            // 좋아요 취소
            const { error: deleteError } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userData.user_id);

            if (deleteError) throw deleteError;
            return res.json({ message: '좋아요가 취소되었습니다.' });
        }

        // 좋아요 추가
        const { error: insertError } = await supabase
            .from('post_likes')
            .insert({
                post_id: postId,
                user_id: userData.user_id
            });

        if (insertError) throw insertError;
        res.json({ message: '좋아요가 추가되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 댓글 작성
router.post('/:post_id/comments', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: req.params.post_id,
                author_id: req.user.id,
                content: req.body.content
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 게시물 저장 (아카이브)
router.post('/:id/archive', auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        // 기존 저장 여부 확인
        const { data: existing, error: checkError } = await supabase
            .from('post_archives')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existing) {
            // 이미 저장한 경우 삭제 (아카이브 해제)
            const { error: deleteError } = await supabase
                .from('post_archives')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (deleteError) throw deleteError;
            return res.json({ message: '게시물 저장이 해제되었습니다.' });
        }

        // 저장 처리
        const { error: insertError } = await supabase
            .from('post_archives')
            .insert({
                post_id: postId,
                user_id: userId
            });

        if (insertError) throw insertError;
        res.json({ message: '게시물이 저장되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 댓글 조회
router.get('/:post_id/comments', async (req, res) => {
    try {
        const { data: comments, error } = await supabase
            .from('post_comments')
            .select(`
                *,
                author:users!inner (
                    user_id,
                    username
                )
            `)
            .eq('post_id', req.params.post_id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 댓글 삭제
router.delete('/:post_id/comments/:comment_id', auth, async (req, res) => {
    try {
        const { post_id, comment_id } = req.params;
        
        // 댓글이 존재하는지, 그리고 현재 사용자의 댓글인지 확인
        const { data: comment, error: checkError } = await supabase
            .from('post_comments')
            .select('*')
            .eq('comment_id', comment_id)
            .eq('post_id', post_id)
            .eq('author_id', req.user.id)
            .single();

        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return res.status(404).json({ message: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.' });
            }
            throw checkError;
        }

        // 댓글 삭제
        const { error: deleteError } = await supabase
            .from('post_comments')
            .delete()
            .eq('comment_id', comment_id)
            .eq('author_id', req.user.id);

        if (deleteError) throw deleteError;

        res.json({ message: '댓글이 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 신고 라우트
router.post('/:post_id/report', auth, async (req, res) => {
    console.log('신고 라우트 진입:', {
        post_id: req.params.post_id,
        user: req.user.id,
        reason: req.body.reason
    });

    const user = req.user;
    const { post_id } = req.params;
    const { reason } = req.body;
  
    if (!reason) {
      return res.status(400).json({ error: '신고 사유는 필수입니다.' });
    }

    // 게시물 존재 여부 확인
    const { data: post, error: postError } = await supabase
        .from('posts')
        .select('post_id')
        .eq('post_id', post_id)
        .single();

    if (postError || !post) {
        console.error('게시물 조회 실패:', postError);
        return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }
  
    // 중복 신고 방지
    const { data: existing, error: selectError } = await supabase
        .from('reports')
        .select('report_id')
        .eq('post_id', post_id)
        .eq('user_id', user.id);
  
    if (selectError) {
        console.error('기존 신고 조회 실패:', selectError);
        return res.status(500).json({ error: '신고 조회 중 오류가 발생했습니다.' });
    }

    if (existing.length > 0) {
        return res.status(400).json({ error: '이미 신고한 게시물입니다.' });
    }
  
    const { error } = await supabase.from('reports').insert([
        {
            post_id,
            reason,
            user_id: user.id,
            reported_at: new Date().toISOString(),
        },
    ]);
  
    if (error) {
        console.error('신고 실패:', error);
        return res.status(500).json({ error: '신고 저장에 실패했습니다.' });
    }
  
    res.status(200).json({ message: '신고가 접수되었습니다.' });
});

export default router; 