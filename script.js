// Function to toggle the navigation bar visibility
function toggleMenu() {
    const leftSidebar = document.querySelector('.left-sidebar');
    const content = document.querySelector('.content');
    const hamburgeroverlay = document.querySelector('.hamburgeroverlay');

    leftSidebar.classList.toggle('show'); // Toggle sidebar visibility
    content.classList.toggle('full-screen');  // Adjust content width

    // Fix: Use getComputedStyle to check the display value
    if (window.getComputedStyle(hamburgeroverlay).display === 'none') {
        hamburgeroverlay.style.display = 'block';
    } else {
        hamburgeroverlay.style.display = 'none';
    }
}


// Function to toggle the search box visibility
function toggleSearchBox() {
    const searchLogo = document.querySelector('.search-logo');
    const searchBox = document.getElementById('searchBox');

    searchLogo.style.display = 'none';
    searchBox.style.display = 'block';
    searchBox.focus();
}


// Close search box if clicked outside
document.addEventListener('click', function(event) {
    const searchLogo = document.querySelector('.search-logo');
    const searchBox = document.getElementById('searchBox');
    if (!searchBox.contains(event.target) && !searchLogo.contains(event.target)) {
        searchBox.style.display = 'none'; // Hide search box
        searchLogo.style.display = 'block'; // Show search logo again
    }
});

const searchBox = document.getElementById('searchBox');

searchBox.addEventListener('focus', () => {
    searchBox.select();
});

// Function to highlight active navigation item
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        // Remove 'active' class from all items
        document.querySelectorAll('.nav-item').forEach(link => {
            link.classList.remove('active');
        });

        // Add 'active' class to the clicked item
        this.classList.add('active');
    });
});

// Function to submit a post
function submitPost() {
    const postInput = document.getElementById('postInput');
    const content = document.querySelector('.content');

    const postContent = postInput.value.trim();
    if (postContent !== "") {
        const newPost = document.createElement('div');
        newPost.classList.add('post');
        
        // Add post content and action icons (like, comment, share, pin)
        newPost.innerHTML = `
            <p>${postContent}</p>
            <div class="post-actions">
                <img src="./images/like.svg" alt="Like" class="action-icon" onclick="likePost(event)">
                <img src="./images/comment.svg" alt="Comment" class="action-icon" onclick="commentPost(event)">
                <img src="./images/share.svg" alt="Share" class="action-icon" onclick="sharePost(event)">
                <img src="./images/pin.svg" alt="Pin" class="action-icon" onclick="pinPost(event)">
            </div>
        `;

        // Add the new post to the content section
        content.appendChild(newPost);

        // Clear the input after posting
        postInput.value = '';
    } else {
        alert("Please enter some content to post.");
    }
}

// Like button functionality
function likePost(event) {
    toggleIcon(event.target, 'like', 'like_2');
}

// Comment button functionality
function commentPost(event) {
    alert("Comment section opens.");
}

// Share button functionality
function sharePost(event) {
    alert("Sharing this post.");
}

// Pin button functionality
function pinPost(event) {
    toggleIcon(event.target, 'pin', 'pinned-icon');
}

// Helper function to toggle the icon images (like/pin)
function toggleIcon(icon, baseIconName, toggledIconName) {
    // Check the current icon source and toggle accordingly
    if (icon.src.includes(baseIconName)) {
        icon.src = `./images/${toggledIconName}.svg`; // Change to toggled icon
    } else {
        icon.src = `./images/${baseIconName}.svg`; // Change back to base icon
    }
}
// Function to toggle the post input visibility
function togglePostInput() {
    const postForm = document.getElementById('postForm');
    
    // Toggle the visibility of the post input form and overlay
    postForm.classList.toggle('show');
}

function loginUser(token) {
    localStorage.setItem('authToken', token); // Store token
    updateUI(); // Update UI based on login status
}

 // 게시물 목록을 가져오는 함수
 async function fetchPosts() {
    try {
        // console.log('게시물 목록 가져오기 시작...');
        const response = await axios.get('http://localhost:5000/posts');
        // console.log('서버 응답:', response.data);
        
        const posts = response.data.data || [];
        const container = document.getElementById('posts-container');
        const isLoggedIn = !!localStorage.getItem('token');
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">아직 게시물이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => {
            // console.log('게시물 데이터:', post); // 디버깅용 로그 추가
            return `
                <div class="post">
                    <div class="post-header">
                        <strong>${post.author?.email?.split('@')[0] || '사용자'}</strong>
                        <small>${new Date(post.created_at).toLocaleString()}</small>
                    </div>
                    <div class="post-content">
                        <p>${post.content}</p>
                    </div>
                    <div class="post-footer">
                        <div class="post-stats">
                            <span onclick="handleLikeClick('${post.post_id}')" class="action-emoji">❤️ ${post.likes_count || 0}</span>
                            <span onclick="handleCommentClick('${post.post_id}')" class="action-emoji">💬 ${post.comments_count || 0}</span>
                            ${isLoggedIn ? `
                                <span onclick="handleArchiveClick('${post.post_id}')" class="action-emoji">📦 ${post.archives_count || 0}</span>
                            ` : ''}
                        </div>
                        ${isLoggedIn ? `
                            <div id="comment-section-${post.post_id}" class="comment-section" style="display: none;">
                                <div id="comments-${post.post_id}" class="comments-list"></div>
                                <div id="comment-form-${post.post_id}" class="comment-form">
                                    <textarea id="comment-text-${post.post_id}" placeholder="댓글을 입력하세요..."></textarea>
                                    <button onclick="submitComment('${post.post_id}')" class="button">댓글 작성</button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // console.log('게시물 표시 완료');
    } catch (error) {
        // console.error('게시물을 불러오는데 실패했습니다:', error);
        const container = document.getElementById('posts-container');
        container.innerHTML = '<p style="text-align: center; color: red;">게시물을 불러오는데 실패했습니다.</p>';
    }
}

// 게시물 작성 함수
async function createPost() {
    const content = document.getElementById('post-content').value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:5000/posts', 
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        hidePostForm();
        fetchPosts();  // 게시물 목록 새로고침
        alert('게시물이 작성되었습니다!');
    } catch (error) {
        // console.error('게시물 작성 실패:', error);
        alert(error.response?.data?.message || '게시물 작성에 실패했습니다.');
    }
}

// 댓글 폼 표시 함수
function showCommentForm(postId) {
    const form = document.getElementById(`comment-form-${postId}`);
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// 댓글 작성 함수
async function submitComment(postId) {
    try {
        const content = document.getElementById(`comment-text-${postId}`).value;
        if (!content.trim()) return;

        const token = localStorage.getItem('token');
        const response = await axios.post(
            `http://localhost:5000/posts/${postId}/comments`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // 댓글 작성 성공 후 처리
        document.getElementById(`comment-text-${postId}`).value = '';
        await loadComments(postId); // 댓글 목록 새로고침
        fetchPosts(); // 게시물 목록 새로고침
    } catch (error) {
        // console.error('댓글 작성 실패:', error);
        alert('댓글 작성에 실패했습니다.');
    }
}

// 댓글 불러오기 함수
async function loadComments(postId) {
    try {
        const response = await axios.get(`http://localhost:5000/posts/${postId}/comments`);
        if (!response.data) throw new Error('댓글을 불러오는데 실패했습니다.');
        
        const comments = response.data;
        const commentsList = document.getElementById(`comments-${postId}`);
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <strong>${comment.author.email.split('@')[0]}</strong>
                    <small>${new Date(comment.created_at).toLocaleString()}</small>
                </div>
                <div class="comment-content">
                    <p>${comment.content}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        // console.error('댓글 로드 오류:', error);
        alert('댓글을 불러오는데 실패했습니다.');
    }
}

// 좋아요 클릭 핸들러 함수
function handleLikeClick(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('좋아요를 누르려면 로그인이 필요합니다.');
        showLoginForm();
        return;
    }
    likePost(postId);
}

// 댓글 클릭 핸들러 함수
async function handleCommentClick(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('댓글을 작성하려면 로그인이 필요합니다.');
        showLoginForm();
        return;
    }

    const commentSection = document.getElementById(`comment-section-${postId}`);
    const commentsList = document.getElementById(`comments-${postId}`);
    
    // 댓글 섹션 토글
    if (commentSection.style.display === 'none') {
        commentSection.style.display = 'block';
        // 댓글 목록 로드
        await loadComments(postId);
    } else {
        commentSection.style.display = 'none';
    }
}

// 좋아요 함수
async function likePost(postId) {
    try {
        const token = localStorage.getItem('token');
        // console.log('좋아요 요청 시작:', {
        //     postId: postId,
        //     token: token ? '존재함' : '없음'
        // });

        const response = await axios.post(
            `http://localhost:5000/posts/${postId}/like`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // console.log('좋아요 응답:', response.data);

        fetchPosts(); // 게시물 목록 새로고침
    } catch (error) {
        // console.error('좋아요 실패 상세:', {
        //     message: error.message,
        //     status: error.response?.status,
        //     data: error.response?.data,
        //     headers: error.response?.headers
        // });
        
        if (error.response?.status === 401) {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            logout();
            showLoginForm();
        } else {
            alert('좋아요 처리에 실패했습니다.');
        }
    }
}

// 페이지 로드 시 게시물 목록 불러오기
document.addEventListener('DOMContentLoaded', fetchPosts);

// Post 버튼 클릭 이벤트 수정
document.addEventListener('DOMContentLoaded', () => {
    // Post 버튼에 클릭 이벤트 추가
    document.querySelector('.show-post-input').addEventListener('click', () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('게시물을 작성하려면 먼저 로그인해주세요.');
            showLoginForm();
            return;
        }
        showPostForm();
    });
});

function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none'; // Hide signup form
    document.getElementById('overlay').style.display = 'block';
}

function showLogoutForm() {
    document.getElementById('log-out-box').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function hideLoginForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function hideLogoutForm(event) {
    if (event.target.id === "overlay") {
        document.getElementById("overlay").style.display = "none";
        document.getElementById("log-out-box").style.display = "none";
    }
}

function hideSidebar(event) {
    if (event.target.id === "overlay") {
        document.getElementById("overlay").style.display = "none";
        document.getElementById("left-sidebar").style.display = "none";
    }
}

    document.getElementById("overlay").addEventListener("click", hideLogoutForm, hideSidebar);

function showSignupForm() {
    hideLoginForm();
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function hideSignupForm() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}


async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        // console.log('로그인 시도:', { email });
        const response = await axios.post('http://localhost:5000/auth/login', {
            email,
            password
        });

        // console.log('로그인 응답:', response.data);

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            updateProfileSection(response.data.user);
            hideLoginForm();
            // 로그인 성공 시 프로필 섹션으로 스크롤
            document.getElementById('profile-section').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        // console.error('로그인 실패:', {
        //     message: error.message,
        //     response: error.response?.data,
        //     status: error.response?.status
        // });
        alert(error.response?.data?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
}

async function signup() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        // console.log('회원가입 시도:', { email });
        const response = await axios.post('http://localhost:5000/auth/signup', {
            email,
            password
        });

        // console.log('회원가입 응답:', response.data);

        if (response.data.user) {
            // 회원가입 성공 시
            alert('회원가입이 완료되었습니다!');
            // 회원가입 팝업 닫기
            hideSignupForm();
            // 로그인 팝업 표시
            showLoginForm();
        }
    } catch (error) {
        // console.error('회원가입 실패:', error.response?.data || error.message);
        alert(error.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateProfileSection(null);
}

function updateProfileSection(user) {
    const loginSection = document.getElementById('login-section');
    const profileContent = document.getElementById('profile-content');
    
    if (user) {
        loginSection.style.display = 'none';
        profileContent.style.display = 'block';
        document.getElementById('profile-name').textContent = user.name || 'User';
        document.getElementById('profile-username').textContent = `@${user.username || 'user'}`;
    } else {
        loginSection.style.display = 'block';
        profileContent.style.display = 'none';
    }
}

// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        updateProfileSection(user);
    }
});

// 게시물 작성 폼 표시
function showPostForm() {
    document.getElementById('post-form').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// 게시물 작성 폼 숨기기
function hidePostForm() {
    document.getElementById('post-form').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// 아카이브 처리 함수 추가
async function handleArchiveClick(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다.');
        showLoginForm();
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/posts/${postId}/archive`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('아카이브 처리 중 오류가 발생했습니다.');
        }

        // 게시물 목록 새로고침
        fetchPosts();
    } catch (error) {
        // console.error('아카이브 처리 오류:', error);
        alert('아카이브 처리 중 오류가 발생했습니다.');
    }
}

// 저장된 게시물 보기 함수 추가
async function showArchivedPosts() {
    try {
        // console.log('프론트엔드: Archived 버튼 클릭됨');
        const token = localStorage.getItem('token');
        // console.log('프론트엔드: 토큰 존재 여부:', !!token);
        
        if (!token) {
            alert('로그인이 필요합니다.');
            showLoginForm();
            return;
        }

        // console.log('프론트엔드: 서버로 요청 전송 시작');
        const response = await axios.get('http://localhost:5000/posts/archived', {
            headers: { Authorization: `Bearer ${token}` }
        });
        // console.log('프론트엔드: 서버 응답 받음:', response.data);

        const posts = response.data.data || [];
        const container = document.getElementById('posts-container');
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">저장된 게시물이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="post">
                <div class="post-header">
                    <strong>${post.author?.email?.split('@')[0] || '사용자'}</strong>
                    <small>${new Date(post.created_at).toLocaleString()}</small>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
                <div class="post-footer">
                    <div class="post-stats">
                        <span onclick="handleLikeClick('${post.post_id}')" class="action-emoji">❤️ ${post.likes_count || 0}</span>
                        <span onclick="handleCommentClick('${post.post_id}')" class="action-emoji">💬 ${post.comments_count || 0}</span>
                        <span onclick="handleArchiveClick('${post.post_id}')" class="action-emoji">📦 ${post.archives_count || 0}</span>
                    </div>
                    <div id="comment-section-${post.post_id}" class="comment-section" style="display: none;">
                        <div id="comments-${post.post_id}" class="comments-list"></div>
                        <div id="comment-form-${post.post_id}" class="comment-form">
                            <textarea id="comment-text-${post.post_id}" placeholder="댓글을 입력하세요..."></textarea>
                            <button onclick="submitComment('${post.post_id}')" class="button">댓글 작성</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        // console.error('프론트엔드: 에러 발생 상세:', {
        //     message: error.message,
        //     status: error.response?.status,
        //     data: error.response?.data,
        //     headers: error.response?.headers
        // });
        
        if (error.response?.status === 401) {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            logout();
            showLoginForm();
        } else {
            alert('저장된 게시물을 불러오는데 실패했습니다.');
        }
    }
}

// 메인 게시물 목록으로 돌아가는 함수 추가
function showAllPosts() {
    fetchPosts();
}