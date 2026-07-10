const express = require('express');
const router = express.Router();
const { prepare } = require('../database/db');

function auth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.get('/search', auth, (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const users = prepare('SELECT id,username,display_name,bio,avatar FROM users WHERE (username LIKE ? OR display_name LIKE ?) AND id != ? LIMIT 20').all(q, q, req.session.userId);
  res.json({ users });
});

router.get('/:id', auth, (req, res) => {
  const user = prepare('SELECT id,username,display_name,bio,avatar,created_at FROM users WHERE id=?').get(parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.posts_count = prepare('SELECT COUNT(*) as c FROM posts WHERE user_id=?').get(user.id).c;
  user.followers_count = prepare('SELECT COUNT(*) as c FROM followers WHERE following_id=?').get(user.id).c;
  user.following_count = prepare('SELECT COUNT(*) as c FROM followers WHERE follower_id=?').get(user.id).c;
  user.is_following = !!prepare('SELECT 1 as v FROM followers WHERE follower_id=? AND following_id=?').get(req.session.userId, user.id);
  user.is_self = user.id === req.session.userId;
  res.json({ user });
});

router.put('/:id', auth, (req, res) => {
  if (parseInt(req.params.id) !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });
  const { display_name, bio, avatar } = req.body;
  if (display_name !== undefined) prepare('UPDATE users SET display_name=? WHERE id=?').run(display_name, req.session.userId);
  if (bio !== undefined) prepare('UPDATE users SET bio=? WHERE id=?').run(bio, req.session.userId);
  if (avatar !== undefined) prepare('UPDATE users SET avatar=? WHERE id=?').run(avatar, req.session.userId);
  const user = prepare('SELECT id,username,display_name,bio,avatar,created_at FROM users WHERE id=?').get(req.session.userId);
  res.json({ user });
});

router.post('/:id/follow', auth, (req, res) => {
  const tid = parseInt(req.params.id);
  if (tid === req.session.userId) return res.status(400).json({ error: 'Cannot follow yourself' });
  try { prepare('INSERT INTO followers (follower_id,following_id) VALUES (?,?)').run(req.session.userId, tid); } catch {}
  res.json({ success: true, following: true });
});

router.delete('/:id/follow', auth, (req, res) => {
  prepare('DELETE FROM followers WHERE follower_id=? AND following_id=?').run(req.session.userId, parseInt(req.params.id));
  res.json({ success: true, following: false });
});

router.get('/:id/followers', auth, (req, res) => {
  const followers = prepare(`SELECT u.id, u.username, u.display_name, u.avatar, u.bio FROM followers f JOIN users u ON u.id=f.follower_id WHERE f.following_id=?`).all(parseInt(req.params.id));
  followers.forEach(u => { u.is_following = !!prepare('SELECT 1 as v FROM followers WHERE follower_id=? AND following_id=?').get(req.session.userId, u.id); });
  res.json({ users: followers });
});

router.get('/:id/following', auth, (req, res) => {
  const following = prepare(`SELECT u.id, u.username, u.display_name, u.avatar, u.bio FROM followers f JOIN users u ON u.id=f.following_id WHERE f.follower_id=?`).all(parseInt(req.params.id));
  following.forEach(u => { u.is_following = !!prepare('SELECT 1 as v FROM followers WHERE follower_id=? AND following_id=?').get(req.session.userId, u.id); });
  res.json({ users: following });
});

router.get('/:id/suggestions', auth, (req, res) => {
  const users = prepare('SELECT id,username,display_name,avatar,bio FROM users WHERE id != ? AND id NOT IN (SELECT following_id FROM followers WHERE follower_id=?) LIMIT 5').all(req.session.userId, req.session.userId);
  res.json({ users });
});

module.exports = router;
