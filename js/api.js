// API wrapper
const API = {
  async request(url, options = {}) {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (e) {
      throw e;
    }
  },
  get(url) { return this.request(url); },
  post(url, body) { return this.request(url, { method: 'POST', body: JSON.stringify(body) }); },
  put(url, body) { return this.request(url, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(url) { return this.request(url, { method: 'DELETE' }); },

  // Auth
  login(username, password) { return this.post('/api/auth/login', { username, password }); },
  register(data) { return this.post('/api/auth/register', data); },
  logout() { return this.post('/api/auth/logout'); },
  me() { return this.get('/api/auth/me'); },

  // Users
  getUser(id) { return this.get(`/api/users/${id}`); },
  updateUser(id, data) { return this.put(`/api/users/${id}`, data); },
  searchUsers(q) { return this.get(`/api/users/search?q=${encodeURIComponent(q)}`); },
  getSuggestions(id) { return this.get(`/api/users/${id}/suggestions`); },
  getFollowers(id) { return this.get(`/api/users/${id}/followers`); },
  getFollowing(id) { return this.get(`/api/users/${id}/following`); },
  follow(id) { return this.post(`/api/users/${id}/follow`); },
  unfollow(id) { return this.delete(`/api/users/${id}/follow`); },

  // Posts
  getFeed() { return this.get('/api/posts/feed'); },
  getExplore() { return this.get('/api/posts/explore'); },
  searchPosts(q) { return this.get(`/api/posts/search?q=${encodeURIComponent(q)}`); },
  getUserPosts(userId) { return this.get(`/api/posts/user/${userId}`); },
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/posts/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  createPost(data) { return this.post('/api/posts', data); },
  deletePost(id) { return this.delete(`/api/posts/${id}`); },

  // Likes
  likePost(id) { return this.post(`/api/posts/${id}/like`); },
  unlikePost(id) { return this.delete(`/api/posts/${id}/like`); },

  // Comments
  getComments(postId) { return this.get(`/api/posts/${postId}/comments`); },
  addComment(postId, content) { return this.post(`/api/posts/${postId}/comments`, { content }); },
  deleteComment(id) { return this.delete(`/api/posts/comments/${id}`); },
};
