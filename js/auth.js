// Auth module
const Auth = {
  init() {
    document.getElementById('login-form').addEventListener('submit', (e) => { e.preventDefault(); this.login(); });
    document.getElementById('register-form').addEventListener('submit', (e) => { e.preventDefault(); this.register(); });
    document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); this.showForm('register'); });
    document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); this.showForm('login'); });
    document.getElementById('demo-login-btn').addEventListener('click', () => this.demoLogin());
  },

  showForm(type) {
    document.getElementById('login-form').classList.toggle('hidden', type !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', type !== 'register');
  },

  async login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    try {
      const { user } = await API.login(username, password);
      App.currentUser = user;
      App.showApp();
    } catch (e) { errorEl.textContent = e.message; }
  },

  async register() {
    const display_name = document.getElementById('reg-displayname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = '';
    try {
      const { user } = await API.register({ display_name, username, email, password });
      App.currentUser = user;
      App.showApp();
    } catch (e) { errorEl.textContent = e.message; }
  },

  async demoLogin() {
    try {
      const { user } = await API.login('demo', 'password123');
      App.currentUser = user;
      App.showApp();
    } catch (e) { showToast(e.message, 'error'); }
  },

  async logout() {
    await API.logout();
    App.currentUser = null;
    App.showAuth();
  }
};
