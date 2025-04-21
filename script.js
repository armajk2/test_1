const backendUrl = 'https://wudl-api.onrender.com'

document.addEventListener('DOMContentLoaded', () => {
    // 이제 모든 함수가 정의된 상태니까 안전하게 실행됨
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
  
          hideLogoutForm();
          hideLoginForm();
          showLoginForm();
        }
        return Promise.reject(error);
      }
    );
  
    // 나머지 초기화 작업들
    fetchPosts();
    loadUserProfile();
  });
  
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

    // 로그인 상태 체크 (token 확인)
    const isLoggedIn = localStorage.getItem('token'); // 로그인 상태 확인

    if (isLoggedIn) {
        // 로그인 상태일 경우 로그아웃 폼 숨기기
        hideLogoutForm();
    } else {
        // 비로그인 상태일 경우 로그인 폼 숨기기
        hideLoginForm();
    }

    const postForm = document.getElementById('post-form');
    if (postForm.style.display === 'block') {
        hidePostForm();
    }

    document.querySelector('.left-sidebar').addEventListener('click', function () {
        toggleMenu();
    });
}


// Function to toggle the search box visibility
function toggleSearchBox() {
    const searchLogo = document.querySelector('.search-logo');
    const searchBox = document.getElementById('searchBox');
    searchLogo.style.display = 'none'; // Hide the search logo
    searchBox.style.display = 'block'; // Show the search box
    searchBox.focus(); // Automatically focus on the search box when visible
}

// Close search box if clicked outside
document.addEventListener('click', function (event) {
    const searchLogo = document.querySelector('.search-logo');
    const searchBox = document.getElementById('searchBox');
    if (!searchBox.contains(event.target) && !searchLogo.contains(event.target)) {
        searchBox.style.display = 'none'; // Hide search box
        searchLogo.style.display = 'block'; // Show search logo again
    }
});

// Function to highlight active navigation item
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function () {
        // Remove 'active' class from all items
        document.querySelectorAll('.nav-item').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelectorAll('.nav-item1').forEach(link => {
            link.classList.remove('active');
        });

        // Add 'active' class to the clicked item
        this.classList.add('active');
    });
});

document.querySelectorAll('.nav-item1').forEach(item => {
    item.addEventListener('click', function () {
        // Remove 'active' class from all items
        document.querySelectorAll('.nav-item').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelectorAll('.nav-item1').forEach(link => {
            link.classList.remove('active');
        });

        // Add 'active' class to the clicked item
        this.classList.add('active');
    });
});


// Helper function to toggle the icon images (like/pin)
function toggleIcon(icon, baseIconName, toggledIconName) {
    // Check the current icon source and toggle accordingly
    if (icon.src.includes(baseIconName)) {
        icon.src = `./images/${toggledIconName}.svg`; // Change to toggled icon
    } else {
        icon.src = `./images/${baseIconName}.svg`; // Change back to base icon
    }
}


function loginUser(token) {
    localStorage.setItem('authToken', token); // Store token
    updateUI(); // Update UI based on login status
}

// 게시물 목록을 가져오는 함수
async function fetchPosts() {
    try {
        // console.log('게시물 목록 가져오기 시작...');
        const response = await axios.get(`${backendUrl}/posts`);
        // console.log('서버 응답:', response.data);

        const posts = response.data.data || [];
        const container = document.getElementById('posts-container');
        const isLoggedIn = !!localStorage.getItem('token');

        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">아직 게시물이 없습니다.</p>';
            return;
        }

        container.innerHTML = posts.map(post => {
            return `
                <div class="post">
                    <div class="post-header">
                        <div>
                        ${isLoggedIn ? 
                            `
                            <strong class="username-link" onclick="showUserProfile('${post.author?.user_id}', '${post.author?.username || '사용자'}')">${post.author?.username || '사용자'}</strong>` :
                            `<span>${post.author?.username || '사용자'}</span>`}

                            <small>${new Date(post.created_at).toLocaleString()}</small>
                        </div>
                        <div class="action-wrapper">
                            <button class="action-trigger" onclick="toggleActionButtons('${post.post_id}')">
                                <img src="./images/dots.svg" alt="More">
                            </button>
                        <div id="action-buttons-${post.post_id}" class="action-buttons-container">
                            <button class="action-button report" onclick="handleReportClick('${post.post_id}')">Report</button>
                    ${ localStorage.getItem('user') && post.author?.user_id === JSON.parse(localStorage.getItem('user')).id
            ? `<button class="action-button delete" onclick="handleDeleteClick('${post.post_id}')">Delete</button>`
            : ''}
    </div>
</div>

                    </div>
                    <div class="post-content">
                        <p>${post.content}</p>
                    </div>
                    <div class="post-footer">
                    <div class="post-stats">
                    <span onclick="handleLikeClick('${post.post_id}')" class="action-emoji">
    <img id="like-icon-${post.post_id}" src="./images/like.svg" alt="Like" style="width: 20px; height: 20px;">
    ${post.likes_count || 0}
</span>

                    <span onclick="handleCommentClick('${post.post_id}')" class="action-emoji">
                        <img src="./images/comment.svg" alt="Comment" style="width: 20px; height: 20px;"> ${post.comments_count || 0}
                    </span>
                    <span onclick="handleArchiveClick('${post.post_id}')" class="action-emoji">
                    ${isLoggedIn ? `

                        <img src="./images/archive.svg" alt="Archive" style="width: 20px; height: 20px;"> ${post.archives_count || 0}
                    </span>
                    ` : ''}

                </div>
                        ${isLoggedIn ? `
                            <div id="comment-section-${post.post_id}" class="comment-section" style="display: none;">
                                <div id="comments-${post.post_id}" class="comments-list"></div>
                                <div id="comment-form-${post.post_id}" class="comment-form">
                                    <textarea id="comment-text-${post.post_id}" placeholder="Leave a comment..."></textarea>
                                    <div class="comment_button">
                                    <button onclick="submitComment('${post.post_id}')" class="comment-action-button post-button">Post</button>
                            <button onclick="hideCommentSection('${post.post_id}')" class="comment-action-button cancel-button">Cancel</button>
                                </div>
                                
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
    loadUserProfile();
}

// 게시물 작성 함수
async function createPost() {
    const content = document.getElementById('post-content').value;
    const category = document.getElementById('post-category').value;
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${backendUrl}/posts`,
            { content, category },
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
            `${backendUrl}/posts/${postId}/comments`,
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
        const response = await axios.get(`${backendUrl}/posts/${postId}/comments`);
        if (!response.data) throw new Error('댓글을 불러오는데 실패했습니다.');

        const comments = response.data;
        const commentsList = document.getElementById(`comments-${postId}`);
        const currentUser = JSON.parse(localStorage.getItem('user'));

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <div>
                        <strong>${comment.author?.username}</strong>
                        <small>${new Date(comment.created_at).toLocaleString()}</small>
                    </div>
                    ${currentUser && comment.author.user_id === currentUser.id ? `
                        <button onclick="handleDeleteComment('${postId}', '${comment.comment_id}')" 
                                class="delete-button">
                            Delete
                        </button>
                    ` : ''}
                </div>
                <div class="comment-content">
                    <p>${comment.content}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        alert('Failed to load comments.');
    }
}

// 좋아요 클릭 핸들러 함수
function handleLikeClick(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to like this post.');
        showLoginForm();
        return;
    }
    likePost(postId);
}

// 댓글 클릭 핸들러 함수
async function handleCommentClick(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to write a comment.');
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
            `${backendUrl}/posts/${postId}/like`,
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
            alert('Your login has expired. Please log in again.');
            logout();
            showLoginForm();
        } else {
            alert('Failed to process the like.');
        }
    }
}

function handleReportClick(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to be logged in to report.');
        showLoginForm();
        return;
    }

    const popup = document.getElementById('report-popup');
    const textarea = document.getElementById('report-reason');
    textarea.value = ''; // 신고 사유 초기화
    textarea.setAttribute('data-post-id', postId); // postId 저장

    // Report 버튼의 onclick 이벤트 핸들러 업데이트
    const reportButton = popup.querySelector('.popup-buttons button:first-child');
    reportButton.onclick = () => submitReport();

    popup.style.display = 'flex';
}

async function submitReport() {
    try {
        const textarea = document.getElementById('report-reason');
        const postId = textarea.getAttribute('data-post-id');
        const reason = textarea.value.trim();
        const token = localStorage.getItem('token');

        console.log('신고 시도:', {
            postId,
            reason,
            hasToken: !!token
        });

        if (!reason) {
            alert('Please enter a reason for reporting.');
            return;
        }

        console.log('신고 요청 전송:', `${backendUrl}/posts/${postId}/report`);
        const response = await axios.post(`${backendUrl}/posts/${postId}/report`,
            { reason },
            {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: function (status) {
                    return status >= 200 && status < 500; // 500 이상의 상태 코드는 에러로 처리
                }
            }
        );

        console.log('신고 응답:', response.data);

        if (response.status === 200) {
            alert('Your report has been submitted.');
            closeReportPopup();
        } else {
            throw new Error(response.data.error || response.data.message || 'An error occurred while processing the report.');
        }
    } catch (error) {
        console.error('신고 오류 상세:', {
            message: error.message,
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            } : '응답 없음',
            request: error.request ? '요청 있음' : '요청 없음'
        });

        if (error.response?.status === 401) {
            alert('Your session has expired. Please log in again.');
            logout();
            showLoginForm();
        } else {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || '신고 중 오류가 발생했습니다.';
            alert(errorMessage);
        }
    }
}



function closeReportPopup() {
    document.getElementById('report-popup').style.display = 'none';
    currentReportPostId = null;
}


// 페이지 로드 시 게시물 목록 불러오기
document.addEventListener('DOMContentLoaded', fetchPosts);

// Post 버튼 클릭 이벤트 수정
document.addEventListener('DOMContentLoaded', () => {
    // Post 버튼에 클릭 이벤트 추가
    document.querySelector('.show-post-input').addEventListener('click', () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in first to create a post.');
            showLoginForm();
            return;
        }
        showPostForm();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Post 버튼에 클릭 이벤트 추가
    document.querySelector('.show-post-input1').addEventListener('click', () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in first to create a post.');
            showLoginForm();
            return;
        }
        showPostForm();
    });
});


function showLoginForm() {
     // 햄버거 메뉴가 열려 있으면 닫기
     const leftSidebar = document.querySelector('.left-sidebar');
     if (leftSidebar.classList.contains('show')) {
         toggleMenu();
     }
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
}

function showLogoutForm() {
     // 햄버거 메뉴가 열려 있으면 닫기
     const leftSidebar = document.querySelector('.left-sidebar');
     if (leftSidebar.classList.contains('show')) {
         toggleMenu();
     }
     // 게시물 작성 폼이 열려 있으면 닫기
    const postForm = document.getElementById('post-form');
    if (postForm.style.display === 'block') {
        hidePostForm();
    }

    document.getElementById('log-out-box').style.display = 'block';
    document.getElementById('overlay2').style.display = 'block';
}

function hideLoginForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function hideLogoutForm() {
    document.getElementById('log-out-box').style.display = 'none';
    document.getElementById('overlay2').style.display = 'none';
}


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
    const email = document.getElementById('profile-name').value;
    const password = document.getElementById('login-password').value;

    try {
        // console.log('로그인 시도:', { email });
        const response = await axios.post(`${backendUrl}/auth/login`, {
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
    fetchPosts();
}

async function signup() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        console.log('회원가입 시도:', { email });
        const response = await axios.post(`${backendUrl}/auth/signup`, {
            email,
            password
        });

        const { user, session } = response.data;

        if (user && !session) {
            alert('가입 완료! 이메일 인증을 완료해야 로그인할 수 있습니다. 메일함을 확인해주세요.');
        } else if (user && session) {
            alert('회원가입이 완료되었습니다!');
        }

        // 회원가입 팝업 닫고 로그인 폼 띄우기
        hideSignupForm();
        showLoginForm();
        
    } catch (error) {
        console.error('회원가입 실패:', error.response?.data || error.message);
        alert(error.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    }
}
function hideCommentSection(postId) {
    const section = document.getElementById(`comment-section-${postId}`);
    if (section) {
        section.style.display = 'none';
    }
}


function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateProfileSection(null);
    hideLogoutForm();
    fetchPosts();
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
    document.getElementById('overlay3').style.display = 'block';
}

// 게시물 작성 폼 숨기기
function hidePostForm() {
    document.getElementById('post-form').style.display = 'none';
    document.getElementById('overlay3').style.display = 'none';
}

// 아카이브 처리 함수 추가
async function handleArchiveClick(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in.');
        showLoginForm();
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/posts/${postId}/archive`, {
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
    hideLogoutForm();
    try {
        const token = localStorage.getItem('token');
        const isLoggedIn = !!token;

        if (!token) {
            alert('You need to log in.');
            showLoginForm();
            return;
        }

        const response = await axios.get(`${backendUrl}/posts/archived`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const posts = response.data.data || [];
        const container = document.getElementById('posts-container');

        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">저장된 게시물이 없습니다.</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post">
                <div class="post-header">
                    <div>
                    ${isLoggedIn ? 

                        `<strong class="username-link" onclick="showUserProfile('${post.author?.user_id}', '${post.author?.username || '사용자'}')">${post.author?.username || '사용자'}</strong>` :
                        `<span>${post.author?.username || '사용자'}</span>`}

                    <small>${new Date(post.created_at).toLocaleString()}</small>
                    </div>
                    <div class="action-wrapper">
                            <button class="action-trigger" onclick="toggleActionButtons('${post.post_id}')">
                                <img src="./images/dots.svg" alt="More">
                            </button>
                        <div id="action-buttons-${post.post_id}" class="action-buttons-container">
                            <button class="action-button report" onclick="handleReportClick('${post.post_id}')">Report</button>
                    ${
        localStorage.getItem('user') &&
        post.author?.user_id === JSON.parse(localStorage.getItem('user')).id
            ? `<button class="action-button delete" onclick="handleDeleteClick('${post.post_id}')">Delete</button>`
            : ''
        }
    </div>
</div>

                    </div>
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
                <div class="post-footer">
                <div class="post-stats">
                <span onclick="handleLikeClick('${post.post_id}')" class="action-emoji">
                <img id="like-icon-${post.post_id}" src="./images/like.svg" alt="Like" style="width: 20px; height: 20px;">
                ${post.likes_count || 0}
            </span>
            
                <span onclick="handleCommentClick('${post.post_id}')" class="action-emoji">
                    <img src="./images/comment.svg" alt="Comment" style="width: 20px; height: 20px;"> ${post.comments_count || 0}
                </span>
                <span onclick="handleArchiveClick('${post.post_id}')" class="action-emoji">
                ${isLoggedIn ? `

                    <img src="./images/archive.svg" alt="Archive" style="width: 20px; height: 20px;"> ${post.archives_count || 0}
                </span>
                ` : ''}

            </div>
                    <div id="comment-section-${post.post_id}" class="comment-section" style="display: none;">
                        <div id="comments-${post.post_id}" class="comments-list"></div>
                        <div id="comment-form-${post.post_id}" class="comment-form">
                            <textarea id="comment-text-${post.post_id}" placeholder="Leave a comment..."></textarea>
                            <div class="comment_button">
                            <button onclick="submitComment('${post.post_id}')" class="comment-action-button post-button">Post</button>
                            <button onclick="hideCommentSection('${post.post_id}')" class="comment-action-button cancel-button">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
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

async function fetchPostsByCategory(category) {
    try {
        const url = `${backendUrl}/posts?category=${category}`;
        const response = await axios.get(url);
        displayPosts(response.data.data);
    } catch (error) {
        console.error('게시물을 불러오는 중 오류 발생:', error);
    }
}

function displayPosts(posts) {
    const container = document.getElementById('posts-container');
    const isLoggedIn = !!localStorage.getItem('token');
    container.innerHTML = ''; // 기존 게시물 지우기

    if (posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">저장된 게시물이 없습니다.</p>';
        return;
    }

    container.innerHTML = posts.map(post => `
            <div class="post">
                <div class="post-header">
                    <div>
                    ${isLoggedIn ? 
                        `<strong class="username-link" onclick="showUserProfile('${post.author?.user_id || post.user_id}', '${post.author?.username || post.username || '사용자'}')">${post.author?.username || '사용자'}</strong>` :
                    `<span>${post.author?.username || post.username || '사용자'}</span>`}
                    <small>${new Date(post.created_at).toLocaleString()}</small>
                    </div>
                    <div class="action-wrapper">
                            <button class="action-trigger" onclick="toggleActionButtons('${post.post_id}')">
                                <img src="./images/dots.svg" alt="More">
                            </button>
                        <div id="action-buttons-${post.post_id}" class="action-buttons-container">
                            <button class="action-button report" onclick="handleReportClick('${post.post_id}')">Report</button>
                    ${
        localStorage.getItem('user') &&
        post.author?.user_id === JSON.parse(localStorage.getItem('user')).id
            ? `<button class="action-button delete" onclick="handleDeleteClick('${post.post_id}')">Delete</button>`
            : ''
        }
    </div>
</div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
                <div class="post-footer">
                <div class="post-stats">
                <span onclick="handleLikeClick('${post.post_id}')" class="action-emoji">
    <img id="like-icon-${post.post_id}" src="./images/like.svg" alt="Like" style="width: 20px; height: 20px;">
    ${post.likes_count || 0}
</span>

                <span onclick="handleCommentClick('${post.post_id}')" class="action-emoji">
                    <img src="./images/comment.svg" alt="Comment" style="width: 20px; height: 20px;"> ${post.comments_count || 0}
                </span>
                <span onclick="handleArchiveClick('${post.post_id}')" class="action-emoji">
                ${isLoggedIn ? `

                    <img src="./images/archive.svg" alt="Archive" style="width: 20px; height: 20px;"> ${post.archives_count || 0}
                </span>
                ` : ''}

            </div>
                    <div id="comment-section-${post.post_id}" class="comment-section" style="display: none;">
                        <div id="comments-${post.post_id}" class="comments-list"></div>
                        <div id="comment-form-${post.post_id}" class="comment-form">
                            <textarea id="comment-text-${post.post_id}" placeholder="Leave a comment..."></textarea>
                            <div class="comment_button">
                            <button onclick="submitComment('${post.post_id}')" class="comment-action-button post-button">Post</button>
                            <button onclick="hideCommentSection('${post.post_id}')" class="comment-action-button cancel-button">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
}

async function fetchTrendingPosts() {
    try {
        const response = await axios.get(`${backendUrl}/posts/trending`);
        console.log(response.data.data);
        displayPosts(response.data.data);
    } catch (error) {
        console.error('트렌딩 게시물 불러오기 실패:', error);
    }
}

document.getElementById("trending").addEventListener("click", fetchTrendingPosts);


function openProfilePopup() {
    document.getElementById('profile-popup').style.display = 'flex';
}

function closeProfilePopup() {
    document.getElementById('profile-popup').style.display = 'none';
}

async function previewAvatar() {
    const file = document.getElementById('avatar-upload').files[0];
    const preview = document.getElementById('avatar-preview');

    if (file) {
        preview.src = URL.createObjectURL(file);
    }
}

// 이미지 리사이징 함수
async function resizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 최대 크기 지정 
                const MAX_SIZE = 40;
                if (width > height && width > MAX_SIZE) {
                    height = Math.round((height * MAX_SIZE) / width);
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = Math.round((width * MAX_SIZE) / height);
                    height = MAX_SIZE;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 이미지 품질을 0.8로 설정하여 용량 감소
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}



async function saveProfile() {
    const fileInput = document.getElementById('avatar-upload');
    const usernameInput = document.getElementById('edit-username');
    const bioInput = document.getElementById('edit-bio');
    const file = fileInput.files[0];
    const username = usernameInput.value.trim();
    const bio = bioInput.value.trim();

    if (!file && !username && !bio) {
        alert('프로필 이미지나 사용자 이름을 입력해주세요.');
        return;
    }

    try {
        const requestData = {};

        if (username) {
            requestData.username = username;
        }

        if (bio) {  // bio가 있으면 추가
            requestData.bio = bio;
        }

        if (file) {
            // 이미지 리사이징
            const resizedImage = await resizeImage(file);
            // Base64로 변환
            const reader = new FileReader();
            reader.readAsDataURL(resizedImage);

            reader.onload = async () => {
                requestData.file_data = reader.result;

                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.post(`${backendUrl}/auth/profile/update`, requestData, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    });

                    if (response.data.avatar_url) {
                        document.getElementById('profile-picture').src = response.data.avatar_url;
                    }

                    if (response.data.username) {
                        const user = JSON.parse(localStorage.getItem('user'));
                        user.username = response.data.username;
                        localStorage.setItem('user', JSON.stringify(user));
                        document.getElementById('profile-username').textContent = response.data.username;
                    }

                    if (response.data.bio) {
                        document.getElementById('profile-bio').textContent = response.data.bio;
                    }

                    alert('프로필이 성공적으로 업데이트되었습니다.');
                    closeProfilePopup();
                } catch (error) {
                    console.error('프로필 저장 오류:', error);
                    alert('프로필 저장 중 오류가 발생했습니다.');
                }
            };
        } else {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${backendUrl}/auth/profile/update`, requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('서버 응답:', response.data);
            if (response.data.username) {
                const user = JSON.parse(localStorage.getItem('user'));
                user.username = response.data.username;
                localStorage.setItem('user', JSON.stringify(user));
                document.getElementById('profile-username').textContent = response.data.username;
            }

            if (response.data.avatar_url) {
                document.getElementById('profile-picture').src = response.data.avatar_url + '?t=' + Date.now();
            }

            if (response.data.bio) {
                document.getElementById('profile-bio').textContent = response.data.bio;
            }

            alert('프로필이 성공적으로 업데이트되었습니다.');
            closeProfilePopup();
        }
    } catch (error) {
        console.error('프로필 저장 오류:', error);
        alert('프로필 저장 중 오류가 발생했습니다.');
    }

}

async function loadUserProfile() {
    const token = localStorage.getItem('token');  // 저장된 토큰
    if (!token) return;

    try {
        // Supabase에서 사용자 정보 불러오기
        const response = await axios.get(`${backendUrl}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const user = response.data;
        console.log('??',user);
        if (user.avatar_url) {
            // 프로필 이미지가 있으면 해당 이미지로 설정
            document.getElementById('profile-picture').src = user.avatar_url;
            document.getElementById('avatar-preview').src = user.avatar_url;
        } else {
            // 기본 프로필 이미지로 설정 (필요시)
            document.getElementById('profile-picture').src = './images/me.svg';
            document.getElementById('avatar-preview').src = './images/me.svg';
        }

        if (user.bio) {
            document.getElementById('profile-bio').textContent = user.bio;
        } else {
            document.getElementById('profile-bio').textContent = 'No bio available';
        }

        if (user.username) {
            // 사용자 이름 설정
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('profile-username2').textContent = user.username;
            document.getElementById('profile-username3').textContent = user.username;
        }
    } catch (error) {
        console.error('사용자 정보 불러오기 오류:', error);
    }
}


function closeUserProfile() {
    document.getElementById('profile-popup2').style.display = 'none';
}

async function searchPosts() {
    const keyword = document.getElementById('searchBox').value;
    if (!keyword) return alert('검색어를 입력해주세요');

    try {
        const response = await axios.get(`${backendUrl}/posts/search?keyword=${encodeURIComponent(keyword)}`);
        const posts = response.data;

        displayPosts(posts);  // 기존에 쓰던 게시물 렌더링 함수 재활용하면 됨
    } catch (error) {
        console.error('검색 실패:', error);
        alert('검색에 실패했습니다.');
    }
}

document.getElementById('searchBox').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        searchPosts();
    }
});

// 페이지 로드 시 실행할 초기화 코드
document.addEventListener('DOMContentLoaded', () => {
    // 신고 팝업 추가
    const reportPopup = document.createElement('div');
    reportPopup.id = 'report-popup';
    reportPopup.className = 'popup-overlay';
    reportPopup.style.display = 'none';
    reportPopup.innerHTML = `
        <div class="popup">
            <h3>Please enter the reason for reporting.</h3>
            <textarea id="report-reason" placeholder="For example: inappropriate content, spam, profanity, etc." maxlength="50"></textarea>
            <div class="popup-buttons">
                <button onclick="submitReport()">Report</button>
                <button onclick="closeReportPopup()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(reportPopup);

    // 기존 이벤트 리스너들...
    fetchPosts();
});

//Delete post
async function handleDeleteClick(postId) {
    const confirmDelete = confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
        const response = await fetch(`${backendUrl}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // 로그인 토큰
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            alert('Post succesfully deleted.');
            // 삭제 후 UI 갱신: 예를 들어 다시 불러오기
            fetchPosts(); // 게시물 다시 불러오는 함수가 있다면 사용
        } else {
            alert(`Delete failed: ${result.error || result.message}`);
        }
    } catch (error) {
        console.error('Error during deletion:', error);
        alert('An error occurred during deletion.');
    }
}

async function displayMyPosts() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!token || !user) {
            alert('Please log in to see your posts');
            showLoginForm();
            return;
        }

        // 사용자의 게시물만 가져오기 위한 API 호출
        const url = `${backendUrl}/posts/my-posts`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.data.length === 0) {
            const container = document.getElementById('posts-container');
            container.innerHTML = '<p style="text-align: center; color: #666;">작성한 게시물이 없습니다.</p>';
            return;
        }

        // 게시물 목록을 표시
        displayPosts(response.data.data);
        hideLogoutForm();
    } catch (error) {
        console.error('게시물을 불러오는 중 오류 발생:', error);
        if (error.response?.status === 401) {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            logout();
            showLoginForm();
        } else {
            alert('게시물을 불러오는데 실패했습니다.');
        }
    }
}

// 댓글 삭제 함수 추가
async function handleDeleteComment(postId, commentId) {
    const confirmDelete = confirm('"Do you want to delete this comment?"');
    if (!confirmDelete) return;

    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
            `${backendUrl}/posts/${postId}/comments/${commentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        alert('댓글이 삭제되었습니다.');
        // 현재 보고 있는 화면에 따라 새로고침
        if (window.location.hash === '#my-comments') {
            displayMyComments();
        } else {
            fetchPosts();
        }
    } catch (error) {
        console.error('댓글 삭제 중 오류 발생:', error);
        alert(error.response?.data?.message || '댓글 삭제에 실패했습니다.');
    }
}

// displayMyComments 함수 수정
async function displayMyComments() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const isLoggedIn = !!localStorage.getItem('token');
        if (!token || !user) {
            alert('내 댓글을 보려면 로그인이 필요합니다.');
            showLoginForm();
            return;
        }

        const url = `${backendUrl}/posts/my-comments`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const comments = response.data.data;

        if (comments.length === 0) {
            const container = document.getElementById('posts-container');
            container.innerHTML = '<p style="text-align: center; color: #666;">작성한 댓글이 없습니다.</p>';
            return;
        }

        const postsWithMyComments = comments.map(item => ({
            ...item.post,
            my_comment: {
                id: item.comment_id,
                content: item.comment_content,
                created_at: item.comment_created_at
            }
        }));

        const container = document.getElementById('posts-container');
        container.innerHTML = postsWithMyComments.map(post => `
            <div class="post">
                <div class="post-header">
                    <div>
                    ${isLoggedIn ? 
                        `<strong class="username-link" onclick="showUserProfile('${post.author?.user_id}', '${post.author?.username || '사용자'}')">${post.author?.username || '사용자'}</strong>` :
                        `<span>${post.author?.username || '사용자'}</span>`}
                    <small>${new Date(post.created_at).toLocaleString()}</small>
                    </div>
                    <div class="action-wrapper">
                            <button class="action-trigger" onclick="toggleActionButtons('${post.post_id}')">
                                <img src="./images/dots.svg" alt="More">
                            </button>
                        <div id="action-buttons-${post.post_id}" class="action-buttons-container">
                            <button class="action-button report" onclick="handleReportClick('${post.post_id}')">Report</button>
                    ${
        localStorage.getItem('user') &&
        post.author?.user_id === JSON.parse(localStorage.getItem('user')).id
            ? `<button class="action-button delete" onclick="handleDeleteClick('${post.post_id}')">Delete</button>`
            : ''
        }
    </div>
</div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
                <div class="post-footer">
                <div class="post-stats">
                <span onclick="handleLikeClick('${post.post_id}')" class="action-emoji">
    <img id="like-icon-${post.post_id}" src="./images/like.svg" alt="Like" style="width: 20px; height: 20px;">
    ${post.likes_count || 0}
</span>

                <span onclick="handleCommentClick('${post.post_id}')" class="action-emoji">
                    <img src="./images/comment.svg" alt="Comment" style="width: 20px; height: 20px;"> ${post.comments_count || 0}
                </span>
                <span onclick="handleArchiveClick('${post.post_id}')" class="action-emoji">
                ${isLoggedIn ? `

                    <img src="./images/archive.svg" alt="Archive" style="width: 20px; height: 20px;"> ${post.archives_count || 0}
                </span>
                ` : ''}

            </div>
                    ${post.my_comment ? `
                        <div class="my-comment" style="margin-top: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <div>
                                    <strong>내 댓글</strong>
                                    <small style="margin-left: 10px;">${new Date(post.my_comment.created_at).toLocaleString()}</small>
                                </div>
                                <button onclick="handleDeleteComment('${post.post_id}', '${post.my_comment.id}')" 
                                        class="delete-button" style="padding: 2px 8px; font-size: 12px;">
                                    삭제
                                </button>
                            </div>
                            <p style="margin: 0;">${post.my_comment.content}</p>
                        </div>
                    ` : ''}
                    <div id="comment-section-${post.post_id}" class="comment-section" style="display: none;">
                        <div id="comments-${post.post_id}" class="comments-list"></div>
                        <div id="comment-form-${post.post_id}" class="comment-form">
                            <textarea id="comment-text-${post.post_id}" placeholder="Leave a comment..."></textarea>
                            <div class="comment_button">
                            <button onclick="submitComment('${post.post_id}')" class="comment-action-button post-button">Post</button>
                            <button onclick="hideCommentSection('${post.post_id}')" class="comment-action-button cancel-button">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        hideLogoutForm();
    } catch (error) {
        console.error('댓글을 불러오는 중 오류 발생:', error);
        if (error.response?.status === 401) {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            logout();
            showLoginForm();
        } else {
            alert('댓글을 불러오는데 실패했습니다.');
        }
    }
}

function showUserProfile(userId, username) {

    // Get the profile popup element
    const profilePopup = document.getElementById('profile-popup2');
    const profileUsername = document.getElementById('profile-username2');

    // Set the username in the popup
    profileUsername.textContent = username;

    // Fetch user data from API
    fetchUserProfile(userId);

    // Show the popup
    profilePopup.style.display = 'flex';

}




async function fetchUserProfile(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${backendUrl}/auth/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const userData = response.data;
        

        // Bio 업데이트
        const bioElement = document.getElementById('profile-bio2');
        if (userData.bio) {
            bioElement.textContent = userData.bio;
        } else {
            bioElement.textContent = 'No bio available.'; // bio가 없으면 기본 텍스트
        }

        // Avatar URL 업데이트
        const avatarElement = document.getElementById('profile-avatar-img');
        if (userData.avatar_url) {
            // 캐시를 방지하기 위해 URL 뒤에 시간 값을 추가
            avatarElement.src = userData.avatar_url + '?t=' + Date.now();
        } else {
            // 기본 프로필 이미지로 설정
            avatarElement.src = './images/me.svg';  // 기본 이미지 경로로 설정
        }

    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

function toggleEditUsername() {
    const currentUsername = document.getElementById('profile-username3');
    const editUsername = document.getElementById('edit-username');
  
    if (editUsername.style.display === 'none') {
      editUsername.value = currentUsername.textContent.trim();
      editUsername.style.display = 'block';
      currentUsername.style.display = 'none';
    } else {
      currentUsername.textContent = editUsername.value;
      editUsername.style.display = 'none';
      currentUsername.style.display = 'block';
    }
  }
  
  function toggleEditBio() {
    const currentBio = document.getElementById('profile-bio');
    const editBio = document.getElementById('edit-bio');
  
    if (editBio.style.display === 'none') {
      editBio.value = currentBio.textContent.trim() === 'No bio available.' ? '' : currentBio.textContent.trim();
      editBio.style.display = 'block';
      currentBio.style.display = 'none';
    } else {
      currentBio.textContent = editBio.value || 'No bio available.';
      editBio.style.display = 'none';
      currentBio.style.display = 'block';
    }
  }
  
  function toggleActionButtons(postId) {
    const container = document.getElementById(`action-buttons-${postId}`);
    if (container) {
        container.classList.toggle('show');
    }
}


// Close action buttons when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.action-buttons-container') && !event.target.closest('.action-trigger')) {
        document.querySelectorAll('.action-buttons-container').forEach(container => {
            container.classList.remove('show');
        });
    }
});

const emailInput = document.getElementById('profile-name');
const passwordInput = document.getElementById('login-password');
const loginButton = document.querySelector('.button_login');

function checkInputs() {
  if (emailInput.value.trim() && passwordInput.value.trim()) {
    loginButton.classList.add('active');
  } else {
    loginButton.classList.remove('active');
  }
}

emailInput.addEventListener('input', checkInputs);
passwordInput.addEventListener('input', checkInputs);

const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupButton = document.querySelector('#signup-form .button_login');

function checkSignupInputs() {
  if (signupEmailInput.value.trim() && signupPasswordInput.value.trim()) {
    signupButton.classList.add('active');
  } else {
    signupButton.classList.remove('active');
  }
}

signupEmailInput.addEventListener('input', checkSignupInputs);
signupPasswordInput.addEventListener('input', checkSignupInputs);

