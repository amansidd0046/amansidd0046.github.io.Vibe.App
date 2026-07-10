// Create Post module
const CreatePost = {
  imageUrl: '',

  init() {
    document.getElementById('open-create-post').addEventListener('click', () => this.open());
    document.getElementById('mobile-create-post').addEventListener('click', () => this.open());
    document.getElementById('close-create-post').addEventListener('click', () => this.close());
    document.getElementById('create-post-modal').querySelector('.modal-overlay').addEventListener('click', () => this.close());

    const textarea = document.getElementById('post-content');
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      document.getElementById('char-count').textContent = `${len}/1000`;
      document.getElementById('submit-post').disabled = len === 0;
    });

    document.getElementById('submit-post').addEventListener('click', () => this.submit());
    document.getElementById('post-image-file').addEventListener('change', (e) => this.handleImageSelect(e));
    document.getElementById('remove-image').addEventListener('click', () => this.removeImage());

    // Submit on Ctrl+Enter
    textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') this.submit();
    });
  },

  open() {
    const modal = document.getElementById('create-post-modal');
    modal.classList.remove('hidden');
    const userDiv = document.getElementById('create-post-user');
    userDiv.innerHTML = `
      <img class="avatar" src="${escapeHtml(App.currentUser.avatar)}" alt="You" onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=200'">
      <span class="username">${escapeHtml(App.currentUser.display_name)}</span>
    `;
    document.getElementById('post-content').focus();
  },

  close() {
    document.getElementById('create-post-modal').classList.add('hidden');
    document.getElementById('post-content').value = '';
    document.getElementById('char-count').textContent = '0/1000';
    document.getElementById('submit-post').disabled = true;
    this.removeImage();
  },

  handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('image-preview').src = event.target.result;
      document.getElementById('image-preview-container').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  },

  removeImage() {
    document.getElementById('post-image-file').value = '';
    document.getElementById('image-preview-container').classList.add('hidden');
    document.getElementById('image-preview').src = '';
  },

  async submit() {
    const content = document.getElementById('post-content').value.trim();
    if (!content) return;
    
    document.getElementById('submit-post').disabled = true;
    document.getElementById('submit-post').textContent = 'Posting...';
    
    try {
      let finalImageUrl = '';
      const fileInput = document.getElementById('post-image-file');
      if (fileInput.files && fileInput.files[0]) {
        const uploadRes = await API.uploadImage(fileInput.files[0]);
        finalImageUrl = uploadRes.imageUrl;
      }
      
      await API.createPost({ content, image: finalImageUrl });
      this.close();
      showToast('Post created! 🎉');
      // Refresh current view
      const hash = window.location.hash || '#/feed';
      App.route(hash);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      document.getElementById('submit-post').textContent = 'Post';
      const len = document.getElementById('post-content').value.length;
      document.getElementById('submit-post').disabled = len === 0;
    }
  }
};
