const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { prepare } = require('../database/db');

router.post('/register', (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const existing = prepare('SELECT id FROM users WHERE username=? OR email=?').get(username, email);
    if (existing) return res.status(400).json({ error: 'Username or email already taken' });
    const hash = bcrypt.hashSync(password, 10);
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(display_name || username)}&background=6c5ce7&color=fff&size=200&bold=true`;
    const result = prepare('INSERT INTO users (username,email,password,display_name,avatar) VALUES (?,?,?,?,?)').run(username, email, hash, display_name || username, avatar);
    req.session.userId = result.lastInsertRowid;
    const user = prepare('SELECT id,username,email,display_name,bio,avatar,created_at FROM users WHERE id=?').get(result.lastInsertRowid);
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = prepare('SELECT * FROM users WHERE username=?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.userId = user.id;
    const { password: _, ...safe } = user;
    res.json({ user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = prepare('SELECT id,username,email,display_name,bio,avatar,created_at FROM users WHERE id=?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ user });
});

module.exports = router;
