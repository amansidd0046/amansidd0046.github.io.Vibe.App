// Feed module
const Feed = {
  openMenuPostId: null,

  renderPostCard(post) {
    const isOwner = App.currentUser && post.user && post.user.id === App.currentUser.id;
    return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <img class="avatar" src="${escapeHtml(post.user.avatar)}" alt="${escapeHtml(post.user.display_name)}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
          <div class="post-user-info">
            <div class="post-username" data-user-id="${post.user.id}">${escapeHtml(post.user.display_name)}</div>
            <div class="post-time">@${escapeHtml(post.user.username)} · ${timeAgo(post.created_at)}</div>
          </div>
          ${isOwner ? `<div class="post-options">
            <button class="btn btn-icon post-options-btn" data-post-id="${post.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            <div class="post-options-menu hidden" id="post-menu-${post.id}">
              <button class="delete-post-btn" data-post-id="${post.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                <span style="color:var(--danger)">Delete</span>
              </button>
            </div>
          </div>` : ''}
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        ${post.image ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="Post image" onerror="this.style.display='none'">` : ''}
        <div class="post-stats">
          <span>${formatNumber(post.likes_count)} like${post.likes_count !== 1 ? 's' : ''}</span>
          <span>${formatNumber(post.comments_count)} comment${post.comments_count !== 1 ? 's' : ''}</span>
        </div>
        <div class="post-actions">
          <button class="post-action like-btn ${post.is_liked ? 'liked' : ''}" data-post-id="${post.id}">
            <svg class="like-heart" width="20" height="20" viewBox="0 0 24 24" fill="${post.is_liked ? 'var(--like-color)' : 'none'}" stroke="${post.is_liked ? 'var(--like-color)' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            <span class="like-count">${formatNumber(post.likes_count)}</span>
          </button>
          <button class="post-action comment-toggle-btn" data-post-id="${post.id}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span>${formatNumber(post.comments_count)}</span>
          </button>
        </div>
        <div class="post-comments hidden" id="comments-${post.id}">
          <div class="comments-list" id="comments-list-${post.id}"></div>
          <div class="comment-form">
            <img class="avatar avatar-sm" src="${App.currentUser ? escapeHtml(App.currentUser.avatar) : ''}" alt="You" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
            <input class="comment-input" placeholder="Write a comment..." data-post-id="${post.id}" id="comment-input-${post.id}">
            <button class="comment-submit" data-post-id="${post.id}">Post</button>
          </div>
        </div>
      </article>
    `;
  },

  async renderFeed(container) {
    container.innerHTML = `<div><div class="feed-header"><h2>Your Feed</h2></div><div class="loading-spinner"></div></div>`;
    try {
      const { posts } = await API.getFeed();
      const inner = container.querySelector('div');
      if (posts.length === 0) {
        inner.innerHTML = `<div class="feed-header"><h2>Your Feed</h2></div>
          <div class="empty-state"><h3>Your feed is empty</h3><p class="text-secondary">Follow some people to see their posts here, or explore to discover content!</p></div>`;
        return;
      }
      inner.innerHTML = `<div class="feed-header"><h2>Your Feed</h2></div>${posts.map(p => this.renderPostCard(p)).join('')}`;
    } catch (e) { container.innerHTML = `<div class="empty-state"><h3>Error loading feed</h3><p>${e.message}</p></div>`; }
  },

  async renderExplore(container) {
    container.innerHTML = `
      <div>
        <div class="feed-header" style="display:flex; flex-direction:column; gap:16px;">
          <h2>Explore</h2>
          <div class="search-container">
            <input type="text" id="explore-search" class="input" placeholder="Search users...">
          </div>
        </div>
        <div id="search-results" style="margin-bottom:20px;"></div>
        <div id="explore-posts">
          <div class="loading-spinner"></div>
        </div>
      </div>
    `;

    // Handle user search
    const searchInput = document.getElementById('explore-search');
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const q = e.target.value.trim();
        const resultsContainer = document.getElementById('search-results');
        if (!q) {
          resultsContainer.innerHTML = '';
          return;
        }
        try {
          resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
          const { users } = await API.searchUsers(q);
          if (users.length === 0) {
            resultsContainer.innerHTML = '<p class="text-secondary text-sm">No users found.</p>';
          } else {
            resultsContainer.innerHTML = `
              <h3 style="margin-bottom:12px; font-size:1rem;">Users</h3>
              <div class="user-list" style="background:var(--glass); border-radius:var(--radius-lg); padding:8px 16px; border:1px solid var(--glass-border);">
                ${users.map(u => `
                  <div class="user-list-item" style="border-bottom:1px solid var(--glass-border); padding:12px 0; display:flex; align-items:center; gap:12px;">
                    <img class="avatar" src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.display_name)}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
                    <div style="flex:1;">
                      <div class="user-list-name" data-user-id="${u.id}" style="font-weight:600; font-size:0.95rem; cursor:pointer;">${escapeHtml(u.display_name)}</div>
                      <div style="font-size:0.8rem; color:var(--text-secondary);">@${escapeHtml(u.username)}</div>
                    </div>
                  </div>
                `).join('').replace(/border-bottom:1px solid var\(--glass-border\);([^<]*)$/, '$1')}
              </div>
            `;
          }
        } catch (err) {
          resultsContainer.innerHTML = `<p class="text-secondary text-sm" style="color:var(--danger)">${err.message}</p>`;
        }
      }, 400);
    });

    const postsContainer = document.getElementById('explore-posts');
    try {
      const { posts } = await API.getExplore();
      postsContainer.innerHTML = posts.map(p => this.renderPostCard(p)).join('');
    } catch (e) { postsContainer.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`; }
  },

  async toggleLike(postId) {
    const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    const btn = card.querySelector('.like-btn');
    const isLiked = btn.classList.contains('liked');
    try {
      const data = isLiked ? await API.unlikePost(postId) : await API.likePost(postId);
      btn.classList.toggle('liked', data.liked);
      const svg = btn.querySelector('svg');
      svg.setAttribute('fill', data.liked ? 'var(--like-color)' : 'none');
      svg.setAttribute('stroke', data.liked ? 'var(--like-color)' : 'currentColor');
      btn.querySelector('.like-count').textContent = formatNumber(data.likes_count);
      // Update stats too
      const stats = card.querySelector('.post-stats span:first-child');
      if (stats) stats.textContent = `${formatNumber(data.likes_count)} like${data.likes_count !== 1 ? 's' : ''}`;
    } catch (e) { showToast(e.message, 'error'); }
  },

  async toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    const isHidden = section.classList.contains('hidden');
    section.classList.toggle('hidden');
    if (isHidden) this.loadComments(postId);
  },

  async loadComments(postId) {
    const list = document.getElementById(`comments-list-${postId}`);
    list.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const { comments } = await API.getComments(postId);
      list.innerHTML = comments.map(c => this.renderComment(c)).join('') || '<p class="text-secondary text-sm" style="padding:8px 0;">No comments yet. Be the first!</p>';
    } catch (e) { list.innerHTML = `<p class="text-secondary">${e.message}</p>`; }
  },

  renderComment(c) {
    const isOwner = App.currentUser && c.user_id === App.currentUser.id;
    return `
      <div class="comment-item" data-comment-id="${c.id}">
        <img class="avatar avatar-sm" src="${escapeHtml(c.avatar)}" alt="${escapeHtml(c.display_name)}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
        <div class="comment-body">
          <span class="comment-author" data-user-id="${c.user_id}">${escapeHtml(c.display_name)}</span>
          <div class="comment-text">${escapeHtml(c.content)}</div>
          <span class="comment-time">${timeAgo(c.created_at)}${isOwner ? `<span class="comment-delete" data-comment-id="${c.id}" data-post-id="${c.post_id}"> · Delete</span>` : ''}</span>
        </div>
      </div>
    `;
  },

  async submitComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;
    try {
      const { comment } = await API.addComment(postId, content);
      input.value = '';
      const list = document.getElementById(`comments-list-${postId}`);
      // Remove "no comments" message if present
      const noComments = list.querySelector('.text-secondary');
      if (noComments) noComments.remove();
      list.insertAdjacentHTML('beforeend', this.renderComment(comment));
      // Update count
      const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
      const commentBtn = card.querySelector('.comment-toggle-btn span');
      const statsSpan = card.querySelector('.post-stats span:last-child');
      const currentCount = parseInt(commentBtn.textContent) || 0;
      commentBtn.textContent = formatNumber(currentCount + 1);
      if (statsSpan) statsSpan.textContent = `${currentCount + 1} comment${currentCount + 1 !== 1 ? 's' : ''}`;
    } catch (e) { showToast(e.message, 'error'); }
  },

  async deleteComment(commentId, postId) {
    try {
      await API.deleteComment(commentId);
      document.querySelector(`.comment-item[data-comment-id="${commentId}"]`).remove();
      showToast('Comment deleted');
    } catch (e) { showToast(e.message, 'error'); }
  },

  async deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    try {
      await API.deletePost(postId);
      document.querySelector(`.post-card[data-post-id="${postId}"]`).remove();
      showToast('Post deleted');
    } catch (e) { showToast(e.message, 'error'); }
  },

  togglePostMenu(postId) {
    // Close any open menu
    if (this.openMenuPostId && this.openMenuPostId !== postId) {
      const prev = document.getElementById(`post-menu-${this.openMenuPostId}`);
      if (prev) prev.classList.add('hidden');
    }
    const menu = document.getElementById(`post-menu-${postId}`);
    if (menu) {
      menu.classList.toggle('hidden');
      this.openMenuPostId = menu.classList.contains('hidden') ? null : postId;
    }
  }
};
