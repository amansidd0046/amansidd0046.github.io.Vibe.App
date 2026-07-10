const express = require('express');
const router = express.Router();
const { prepare } = require('../database/db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

function auth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function enrichPost(post, userId) {
  post.likes_count = prepare('SELECT COUNT(*) as c FROM likes WHERE post_id=?').get(post.id).c;
  post.comments_count = prepare('SELECT COUNT(*) as c FROM comments WHERE post_id=?').get(post.id).c;
  post.is_liked = !!prepare('SELECT 1 as v FROM likes WHERE post_id=? AND user_id=?').get(post.id, userId);
  post.user = prepare('SELECT id,username,display_name,avatar FROM users WHERE id=?').get(post.user_id);
  return post;
}

router.get('/search', auth, (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const posts = prepare('SELECT * FROM posts WHERE content LIKE ? ORDER BY created_at DESC LIMIT 30').all(q);
  res.json({ posts: posts.map(p => enrichPost(p, req.session.userId)) });
});

router.get('/feed', auth, (req, res) => {
  const posts = prepare(`SELECT p.* FROM posts p WHERE p.user_id IN (SELECT following_id FROM followers WHERE follower_id=?) OR p.user_id=? ORDER BY p.created_at DESC LIMIT 50`).all(req.session.userId, req.session.userId);
  res.json({ posts: posts.map(p => enrichPost(p, req.session.userId)) });
});

router.get('/explore', auth, (req, res) => {
  const posts = prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50').all();
  res.json({ posts: posts.map(p => enrichPost(p, req.session.userId)) });
});

router.get('/user/:userId', auth, (req, res) => {
  const posts = prepare('SELECT * FROM posts WHERE user_id=? ORDER BY created_at DESC').all(parseInt(req.params.userId));
  res.json({ posts: posts.map(p => enrichPost(p, req.session.userId)) });
});

router.post('/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

router.post('/', auth, (req, res) => {
  const { content, image } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
  const result = prepare('INSERT INTO posts (user_id,content,image) VALUES (?,?,?)').run(req.session.userId, content.trim(), image || '');
  const post = prepare('SELECT * FROM posts WHERE id=?').get(result.lastInsertRowid);
  res.json({ post: enrichPost(post, req.session.userId) });
});

router.delete('/:id', auth, (req, res) => {
  const post = prepare('SELECT * FROM posts WHERE id=?').get(parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.user_id !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });
  prepare('DELETE FROM posts WHERE id=?').run(parseInt(req.params.id));
  res.json({ success: true });
});

router.post('/:id/like', auth, (req, res) => {
  try { prepare('INSERT INTO likes (post_id,user_id) VALUES (?,?)').run(parseInt(req.params.id), req.session.userId); } catch {}
  const count = prepare('SELECT COUNT(*) as c FROM likes WHERE post_id=?').get(parseInt(req.params.id)).c;
  res.json({ liked: true, likes_count: count });
});

router.delete('/:id/like', auth, (req, res) => {
  prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').run(parseInt(req.params.id), req.session.userId);
  const count = prepare('SELECT COUNT(*) as c FROM likes WHERE post_id=?').get(parseInt(req.params.id)).c;
  res.json({ liked: false, likes_count: count });
});

router.get('/:id/comments', auth, (req, res) => {
  const comments = prepare(`SELECT c.*, u.username, u.display_name, u.avatar FROM comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? ORDER BY c.created_at ASC`).all(parseInt(req.params.id));
  res.json({ comments });
});

router.post('/:id/comments', auth, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
  const result = prepare('INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)').run(parseInt(req.params.id), req.session.userId, content.trim());
  const comment = prepare(`SELECT c.*, u.username, u.display_name, u.avatar FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?`).get(result.lastInsertRowid);
  res.json({ comment });
});

router.delete('/comments/:id', auth, (req, res) => {
  const comment = prepare('SELECT * FROM comments WHERE id=?').get(parseInt(req.params.id));
  if (!comment) return res.status(404).json({ error: 'Not found' });
  if (comment.user_id !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });
  prepare('DELETE FROM comments WHERE id=?').run(parseInt(req.params.id));
  res.json({ success: true });
});

module.exports = router;
