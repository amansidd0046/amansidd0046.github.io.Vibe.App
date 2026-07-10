// Main App
const App = {
  currentUser: null,

  async init() {
    Auth.init();
    CreatePost.init();

    // Modal close handlers
    document.getElementById('close-edit-profile').addEventListener('click', () => {
      document.getElementById('edit-profile-modal').classList.add('hidden');
    });
    document.getElementById('edit-profile-modal').querySelector('.modal-overlay').addEventListener('click', () => {
      document.getElementById('edit-profile-modal').classList.add('hidden');
    });
    document.getElementById('save-profile').addEventListener('click', () => Profile.saveProfile());

    // Global click delegation
    document.addEventListener('click', (e) => this.handleClick(e));

    // Comment submit on Enter
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && e.target.classList.contains('comment-input')) {
        e.preventDefault();
        Feed.submitComment(e.target.dataset.postId);
      }
    });

    // Hash change routing
    window.addEventListener('hashchange', () => this.route(window.location.hash));

    // Check auth
    try {
      const { user } = await API.me();
      this.currentUser = user;
      this.showApp();
    } catch {
      this.showAuth();
    }
  },

  handleClick(e) {
    const target = e.target.closest('[data-user-id]');
    if (target && !target.closest('.post-action') && !target.closest('button[data-follow-user-id]')) {
      const userId = target.dataset.userId;
      if (userId) this.navigate(`#/profile/${userId}`);
      return;
    }

    // Like button
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) { Feed.toggleLike(likeBtn.dataset.postId); return; }

    // Comment toggle
    const commentBtn = e.target.closest('.comment-toggle-btn');
    if (commentBtn) { Feed.toggleComments(commentBtn.dataset.postId); return; }

    // Comment submit
    const commentSubmit = e.target.closest('.comment-submit');
    if (commentSubmit) { Feed.submitComment(commentSubmit.dataset.postId); return; }

    // Comment delete
    const commentDelete = e.target.closest('.comment-delete');
    if (commentDelete) { Feed.deleteComment(commentDelete.dataset.commentId, commentDelete.dataset.postId); return; }

    // Post options menu
    const optionsBtn = e.target.closest('.post-options-btn');
    if (optionsBtn) { Feed.togglePostMenu(optionsBtn.dataset.postId); return; }

    // Delete post
    const deleteBtn = e.target.closest('.delete-post-btn');
    if (deleteBtn) { Feed.deletePost(deleteBtn.dataset.postId); return; }

    // Follow button (in profile)
    const followBtn = e.target.closest('#follow-btn');
    if (followBtn) { Profile.toggleFollow(followBtn.dataset.userId); return; }

    // Follow button (in lists/suggestions)
    const followUserBtn = e.target.closest('[data-follow-user-id]');
    if (followUserBtn) { this.handleFollowInList(followUserBtn); return; }

    // Edit profile
    if (e.target.closest('#edit-profile-btn')) { Profile.openEditModal(); return; }

    // Profile tabs
    const tab = e.target.closest('.profile-tab');
    if (tab) { this.handleProfileTab(tab); return; }

    // Followers/Following stats
    const followersStat = e.target.closest('#followers-stat');
    if (followersStat) { Profile.showFollowers(followersStat.dataset.userId); return; }
    const followingStat = e.target.closest('#following-stat');
    if (followingStat) { Profile.showFollowing(followingStat.dataset.userId); return; }

    // Logout
    if (e.target.closest('#logout-btn')) { Auth.logout(); return; }

    // Close post menus on outside click
    if (!e.target.closest('.post-options')) {
      if (Feed.openMenuPostId) {
        const menu = document.getElementById(`post-menu-${Feed.openMenuPostId}`);
        if (menu) menu.classList.add('hidden');
        Feed.openMenuPostId = null;
      }
    }
  },

  async handleFollowInList(btn) {
    const userId = btn.dataset.followUserId;
    const isFollowing = btn.classList.contains('following');
    try {
      if (isFollowing) {
        await API.unfollow(userId);
        btn.classList.remove('following', 'btn-secondary');
        btn.classList.add('btn-primary');
        btn.textContent = 'Follow';
      } else {
        await API.follow(userId);
        btn.classList.add('following', 'btn-secondary');
        btn.classList.remove('btn-primary');
        btn.textContent = 'Following';
      }
    } catch (e) { showToast(e.message, 'error'); }
  },

  handleProfileTab(tab) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const content = document.getElementById('profile-content');
    if (tab.dataset.tab === 'grid') {
      content.innerHTML = Profile.renderPostsGrid(Profile.currentPosts);
    } else {
      content.innerHTML = Profile.renderPostsList(Profile.currentPosts);
    }
  },

  showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
  },

  showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    this.updateSidebarUser();
    this.updateNavProfile();
    this.loadSuggestions();
    if (!window.location.hash || window.location.hash === '#/') {
      window.location.hash = '#/feed';
    } else {
      this.route(window.location.hash);
    }
  },

  updateSidebarUser() {
    const el = document.getElementById('sidebar-user');
    if (!this.currentUser) return;
    el.innerHTML = `
      <img class="avatar avatar-sm" src="${escapeHtml(this.currentUser.avatar)}" alt="You" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${escapeHtml(this.currentUser.display_name)}</div>
        <div class="sidebar-user-handle">@${escapeHtml(this.currentUser.username)}</div>
      </div>
      <button class="btn btn-icon" id="logout-btn" title="Logout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    `;
  },

  updateNavProfile() {
    if (!this.currentUser) return;
    const navProfile = document.getElementById('nav-profile');
    if (navProfile) navProfile.href = `#/profile/${this.currentUser.id}`;
    // Mobile nav
    const mobileProfile = document.querySelector('.mobile-nav-item[data-route="profile"]');
    if (mobileProfile) mobileProfile.href = `#/profile/${this.currentUser.id}`;
  },

  async loadSuggestions() {
    if (!this.currentUser) return;
    try {
      const { users } = await API.getSuggestions(this.currentUser.id);
      const widget = document.getElementById('suggestions-widget');
      if (users.length === 0) { widget.innerHTML = ''; return; }
      widget.innerHTML = `
        <div class="widget-title">Suggested for you</div>
        ${users.map(u => `
          <div class="suggestion-item">
            <img class="avatar avatar-sm" src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.display_name)}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
            <div class="suggestion-info">
              <div class="suggestion-name" data-user-id="${u.id}">${escapeHtml(u.display_name)}</div>
              <div class="suggestion-handle">@${escapeHtml(u.username)}</div>
            </div>
            <button class="btn btn-sm btn-primary btn-follow" data-follow-user-id="${u.id}">Follow</button>
          </div>
        `).join('')}
      `;
    } catch {}
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  route(hash) {
    const container = document.getElementById('main-content');

    // Update active nav
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
      el.classList.remove('active');
      if (hash.startsWith(`#/${el.dataset.route}`)) el.classList.add('active');
    });

    if (hash.startsWith('#/profile/')) {
      const userId = hash.split('/')[2];
      Profile.render(container, userId);
    } else if (hash === '#/explore') {
      Feed.renderExplore(container);
    } else {
      Feed.renderFeed(container);
    }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
