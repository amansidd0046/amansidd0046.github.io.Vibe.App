// Profile module
const Profile = {
  async render(container, userId) {
    container.innerHTML = '<div><div class="loading-spinner"></div></div>';
    try {
      const { user } = await API.getUser(userId);
      const { posts } = await API.getUserPosts(userId);

      container.innerHTML = `<div class="profile-page">
        <div class="profile-header">
          <div class="profile-cover">
            <div class="profile-avatar-wrapper">
              <img class="profile-avatar" src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.display_name)}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
            </div>
          </div>
          <div class="profile-info">
            <div class="profile-top">
              <div>
                <div class="profile-name">${escapeHtml(user.display_name)}</div>
                <div class="profile-handle">@${escapeHtml(user.username)}</div>
              </div>
              ${user.is_self
                ? `<button class="btn btn-secondary" id="edit-profile-btn">Edit Profile</button>`
                : `<button class="btn btn-follow ${user.is_following ? 'following btn-secondary' : 'btn-primary'}" 
                    id="follow-btn" data-user-id="${user.id}">
                    ${user.is_following ? 'Following' : 'Follow'}
                  </button>`
              }
            </div>
            ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ''}
            <div class="profile-stats">
              <div class="stat-item"><div class="stat-value">${formatNumber(user.posts_count)}</div><div class="stat-label">Posts</div></div>
              <div class="stat-item" id="followers-stat" data-user-id="${user.id}" style="cursor:pointer"><div class="stat-value">${formatNumber(user.followers_count)}</div><div class="stat-label">Followers</div></div>
              <div class="stat-item" id="following-stat" data-user-id="${user.id}" style="cursor:pointer"><div class="stat-value">${formatNumber(user.following_count)}</div><div class="stat-label">Following</div></div>
            </div>
          </div>
        </div>
        <div class="profile-tabs">
          <div class="profile-tab active" data-tab="grid">Grid</div>
          <div class="profile-tab" data-tab="posts">Posts</div>
        </div>
        <div id="profile-content">
          ${this.renderPostsGrid(posts)}
        </div>
      </div>`;

      // Store for tab switching
      this.currentUser = user;
      this.currentPosts = posts;
    } catch (e) { container.innerHTML = `<div class="empty-state"><h3>User not found</h3><p>${e.message}</p></div>`; }
  },

  renderPostsGrid(posts) {
    if (posts.length === 0) return '<div class="empty-state"><h3>No posts yet</h3><p class="text-secondary">Posts will appear here.</p></div>';
    return `<div class="profile-posts-grid">${posts.map(p => {
      if (p.image) {
        return `<div class="grid-post" data-post-id="${p.id}">
          <img src="${escapeHtml(p.image)}" alt="Post" onerror="this.parentElement.innerHTML='<div class=grid-post-text>${escapeHtml(p.content).substring(0,60)}</div>'">
          <div class="grid-post-overlay">
            <span>❤ ${formatNumber(p.likes_count)}</span>
            <span>💬 ${formatNumber(p.comments_count)}</span>
          </div>
        </div>`;
      }
      return `<div class="grid-post-text" data-post-id="${p.id}">${escapeHtml(p.content).substring(0, 80)}${p.content.length > 80 ? '...' : ''}</div>`;
    }).join('')}</div>`;
  },

  renderPostsList(posts) {
    if (posts.length === 0) return '<div class="empty-state"><h3>No posts yet</h3></div>';
    return posts.map(p => Feed.renderPostCard(p)).join('');
  },

  async toggleFollow(userId) {
    const btn = document.getElementById('follow-btn');
    if (!btn) return;
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
      // Update follower count
      const followersStat = document.querySelector('#followers-stat .stat-value');
      if (followersStat) {
        let count = parseInt(followersStat.textContent) || 0;
        followersStat.textContent = formatNumber(isFollowing ? count - 1 : count + 1);
      }
    } catch (e) { showToast(e.message, 'error'); }
  },

  async showFollowers(userId) {
    const content = document.getElementById('profile-content');
    content.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const { users } = await API.getFollowers(userId);
      content.innerHTML = `<h3 style="margin-bottom:16px">Followers</h3>` + this.renderUserList(users);
    } catch (e) { content.innerHTML = `<p>${e.message}</p>`; }
  },

  async showFollowing(userId) {
    const content = document.getElementById('profile-content');
    content.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const { users } = await API.getFollowing(userId);
      content.innerHTML = `<h3 style="margin-bottom:16px">Following</h3>` + this.renderUserList(users);
    } catch (e) { content.innerHTML = `<p>${e.message}</p>`; }
  },

  renderUserList(users) {
    if (users.length === 0) return '<div class="empty-state"><p class="text-secondary">No users found.</p></div>';
    return `<div class="user-list">${users.map(u => `
      <div class="user-list-item">
        <img class="avatar" src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.display_name)}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
        <div class="user-list-info">
          <div class="user-list-name" data-user-id="${u.id}">${escapeHtml(u.display_name)}</div>
          <div class="user-list-bio">@${escapeHtml(u.username)}${u.bio ? ' · ' + escapeHtml(u.bio) : ''}</div>
        </div>
        ${u.id !== App.currentUser.id ? `<button class="btn btn-sm btn-follow ${u.is_following ? 'following btn-secondary' : 'btn-primary'}" 
          data-follow-user-id="${u.id}">${u.is_following ? 'Following' : 'Follow'}</button>` : ''}
      </div>
    `).join('')}</div>`;
  },

  openEditModal() {
    const modal = document.getElementById('edit-profile-modal');
    modal.classList.remove('hidden');
    document.getElementById('edit-displayname').value = App.currentUser.display_name || '';
    document.getElementById('edit-bio').value = App.currentUser.bio || '';
    document.getElementById('edit-avatar').value = App.currentUser.avatar || '';
  },

  async saveProfile() {
    const display_name = document.getElementById('edit-displayname').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const avatar = document.getElementById('edit-avatar').value.trim();
    try {
      const { user } = await API.updateUser(App.currentUser.id, { display_name, bio, avatar });
      App.currentUser = { ...App.currentUser, ...user };
      App.updateSidebarUser();
      document.getElementById('edit-profile-modal').classList.add('hidden');
      showToast('Profile updated!');
      App.navigate(`#/profile/${App.currentUser.id}`);
    } catch (e) { showToast(e.message, 'error'); }
  }
};
