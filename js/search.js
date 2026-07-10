// Search module
const Search = {
  debounceTimer: null,
  isOpen: false,

  init() {
    const searchInput = document.getElementById('global-search-input');
    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    const searchPanel = document.getElementById('search-panel');
    const searchPanelInput = document.getElementById('search-panel-input');

    if (!searchInput) return;

    // Desktop sidebar search
    searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value, 'search-dropdown'));
    searchInput.addEventListener('focus', () => {
      const dropdown = document.getElementById('search-dropdown');
      if (searchInput.value.trim()) dropdown.classList.remove('hidden');
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        const dropdown = document.getElementById('search-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
      }
      if (!e.target.closest('.search-panel') && !e.target.closest('#mobile-search-btn')) {
        this.closeMobileSearch();
      }
    });

    // Keyboard shortcut: Ctrl+K or /
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.target.matches('input, textarea'))) {
        e.preventDefault();
        if (window.innerWidth <= 768) {
          this.openMobileSearch();
        } else {
          searchInput.focus();
        }
      }
      if (e.key === 'Escape') {
        const dropdown = document.getElementById('search-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
        searchInput.blur();
        this.closeMobileSearch();
      }
    });

    // Mobile search
    if (mobileSearchBtn) {
      mobileSearchBtn.addEventListener('click', () => this.openMobileSearch());
    }
    if (searchClose) {
      searchClose.addEventListener('click', () => this.closeMobileSearch());
    }
    if (searchOverlay) {
      searchOverlay.addEventListener('click', () => this.closeMobileSearch());
    }
    if (searchPanelInput) {
      searchPanelInput.addEventListener('input', (e) => this.handleSearch(e.target.value, 'search-panel-results'));
    }
  },

  openMobileSearch() {
    const overlay = document.getElementById('search-overlay');
    const panel = document.getElementById('search-panel');
    const input = document.getElementById('search-panel-input');
    if (overlay) overlay.classList.add('active');
    if (panel) panel.classList.add('active');
    this.isOpen = true;
    setTimeout(() => { if (input) input.focus(); }, 300);
  },

  closeMobileSearch() {
    const overlay = document.getElementById('search-overlay');
    const panel = document.getElementById('search-panel');
    if (overlay) overlay.classList.remove('active');
    if (panel) panel.classList.remove('active');
    this.isOpen = false;
  },

  handleSearch(query, targetId) {
    clearTimeout(this.debounceTimer);
    const container = document.getElementById(targetId);
    const q = query.trim();

    if (!q) {
      if (container) container.innerHTML = '';
      if (targetId === 'search-dropdown') container.classList.add('hidden');
      return;
    }

    if (container && targetId === 'search-dropdown') container.classList.remove('hidden');

    // Show loading
    if (container) {
      container.innerHTML = `
        <div class="search-loading">
          <div class="search-loading-spinner"></div>
          <span>Searching...</span>
        </div>
      `;
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        const [usersRes, postsRes] = await Promise.all([
          API.searchUsers(q),
          API.searchPosts(q)
        ]);

        const users = usersRes.users || [];
        const posts = postsRes.posts || [];

        if (users.length === 0 && posts.length === 0) {
          container.innerHTML = `
            <div class="search-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No results for "<strong>${escapeHtml(q)}</strong>"</p>
            </div>
          `;
          return;
        }

        let html = '';

        // Users section
        if (users.length > 0) {
          html += `<div class="search-section">
            <div class="search-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              People
            </div>
            ${users.slice(0, 5).map(u => `
              <div class="search-result-item" data-user-id="${u.id}" onclick="Search.goToUser(${u.id})">
                <img class="avatar avatar-sm" src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.display_name)}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
                <div class="search-result-info">
                  <div class="search-result-name">${this.highlight(u.display_name, q)}</div>
                  <div class="search-result-handle">@${this.highlight(u.username, q)}</div>
                </div>
              </div>
            `).join('')}
          </div>`;
        }

        // Posts section
        if (posts.length > 0) {
          html += `<div class="search-section">
            <div class="search-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
              Posts
            </div>
            ${posts.slice(0, 5).map(p => `
              <div class="search-result-item search-post-result" onclick="Search.goToPost(${p.user.id})">
                <img class="avatar avatar-sm" src="${escapeHtml(p.user.avatar)}" alt="${escapeHtml(p.user.display_name)}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
                <div class="search-result-info">
                  <div class="search-result-name">${escapeHtml(p.user.display_name)}</div>
                  <div class="search-result-preview">${this.highlight(this.truncate(p.content, 80), q)}</div>
                </div>
                ${p.image ? `<div class="search-post-thumb"><img src="${escapeHtml(p.image)}" alt="" onerror="this.parentElement.remove()"></div>` : ''}
              </div>
            `).join('')}
          </div>`;
        }

        container.innerHTML = html;
      } catch (err) {
        container.innerHTML = `<div class="search-empty"><p style="color:var(--danger)">${err.message}</p></div>`;
      }
    }, 350);
  },

  highlight(text, query) {
    if (!text || !query) return escapeHtml(text || '');
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  truncate(text, max) {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  },

  goToUser(userId) {
    this.closeMobileSearch();
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    const input = document.getElementById('global-search-input');
    if (input) input.value = '';
    App.navigate(`#/profile/${userId}`);
  },

  goToPost(userId) {
    this.closeMobileSearch();
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    const input = document.getElementById('global-search-input');
    if (input) input.value = '';
    App.navigate(`#/profile/${userId}`);
  }
};
