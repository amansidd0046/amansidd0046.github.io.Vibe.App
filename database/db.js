const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'vibe.db');
let db;

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, display_name TEXT NOT NULL, bio TEXT DEFAULT '', avatar TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, content TEXT NOT NULL,
    image TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS followers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, follower_id INTEGER NOT NULL, following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Seed
  const r = db.exec('SELECT COUNT(*) as c FROM users');
  if (r[0].values[0][0] === 0) seed();
  save();
  return db;
}

function save() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function seed() {
  const hash = bcrypt.hashSync('password123', 10);
  const users = [
    ['demo','demo@vibe.com',hash,'Demo User','Welcome to Vibe! 🎉','https://ui-avatars.com/api/?name=Demo+User&background=6c5ce7&color=fff&size=200&bold=true'],
    ['sarah_designs','sarah@vibe.com',hash,'Sarah Chen','✨ UI/UX Designer | Beautiful experiences','https://ui-avatars.com/api/?name=Sarah+Chen&background=e84393&color=fff&size=200&bold=true'],
    ['alex_code','alex@vibe.com',hash,'Alex Rivera','💻 Full-stack dev | Open source lover','https://ui-avatars.com/api/?name=Alex+Rivera&background=00cec9&color=fff&size=200&bold=true'],
    ['maya_photo','maya@vibe.com',hash,'Maya Patel','📸 Photographer | Capturing moments','https://ui-avatars.com/api/?name=Maya+Patel&background=fdcb6e&color=333&size=200&bold=true'],
    ['james_fit','james@vibe.com',hash,'James Wilson','💪 Fitness coach | Healthy lifestyle','https://ui-avatars.com/api/?name=James+Wilson&background=ff6b6b&color=fff&size=200&bold=true'],
  ];
  const uids = users.map(u => { db.run('INSERT INTO users (username,email,password,display_name,bio,avatar) VALUES (?,?,?,?,?,?)', u); return getLastId(); });

  const posts = [
    [uids[0],'Just launched my new project! 🚀 So excited to share it with everyone!','https://picsum.photos/seed/vibe1/800/500'],
    [uids[1],'New dashboard design concept 💎 Clean, modern, and user-friendly.','https://picsum.photos/seed/vibe2/800/500'],
    [uids[2],'Just published my latest open-source library! 📦 Makes state management a breeze.',''],
    [uids[3],'Golden hour in the mountains 🌄 The best shots are unplanned.','https://picsum.photos/seed/vibe3/800/500'],
    [uids[4],'Morning workout complete! 💪 Consistency > intensity.','https://picsum.photos/seed/vibe4/800/500'],
    [uids[1],'Playing with gradients and glass effects ✨','https://picsum.photos/seed/vibe5/800/500'],
    [uids[0],'Coffee + code = perfect morning ☕💻',''],
    [uids[2],'Hot take: CSS is a programming language. Change my mind 😤',''],
    [uids[3],'Street photography in Tokyo 🇯🇵','https://picsum.photos/seed/vibe6/800/500'],
    [uids[4],'Meal prep Sunday! 🥗 Clean eating can be fun.','https://picsum.photos/seed/vibe7/800/500'],
    [uids[0],'Learning WebGL shaders today. Mind = blown 🤯','https://picsum.photos/seed/vibe8/800/500'],
    [uids[3],'Night photography tip: tripod + long exposure + patience = magic 📷','https://picsum.photos/seed/vibe9/800/500'],
  ];
  const pids = posts.map(p => { db.run('INSERT INTO posts (user_id,content,image) VALUES (?,?,?)', p); return getLastId(); });

  [[pids[0],uids[1],'This looks amazing! 🔥'],[pids[0],uids[2],'Congrats on the launch! 🎉'],[pids[0],uids[3],"Can't wait to try it!"],
   [pids[1],uids[0],'Beautiful work Sarah!'],[pids[1],uids[4],'So clean and modern!'],
   [pids[2],uids[0],'Exactly what I needed!'],[pids[3],uids[1],'Stunning! 😍 Where is this?'],
   [pids[4],uids[2],'You inspire me!'],[pids[7],uids[0],'100% agree 😂'],[pids[7],uids[3],'Controversial but true!'],
   [pids[8],uids[4],'Tokyo is on my bucket list!']
  ].forEach(c => db.run('INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)', c));

  [[pids[0],uids[1]],[pids[0],uids[2]],[pids[0],uids[3]],[pids[0],uids[4]],
   [pids[1],uids[0]],[pids[1],uids[2]],[pids[1],uids[3]],[pids[2],uids[0]],[pids[2],uids[1]],
   [pids[3],uids[0]],[pids[3],uids[2]],[pids[3],uids[4]],[pids[4],uids[0]],[pids[4],uids[1]],[pids[4],uids[3]],
   [pids[5],uids[0]],[pids[5],uids[2]],[pids[7],uids[1]],[pids[7],uids[3]],[pids[7],uids[4]],
   [pids[8],uids[1]],[pids[8],uids[2]],[pids[10],uids[1]],[pids[10],uids[3]],[pids[11],uids[0]],[pids[11],uids[2]]
  ].forEach(l => { try { db.run('INSERT INTO likes (post_id,user_id) VALUES (?,?)', l); } catch {} });

  [[uids[0],uids[1]],[uids[0],uids[2]],[uids[0],uids[3]],
   [uids[1],uids[0]],[uids[2],uids[0]],[uids[3],uids[0]],[uids[4],uids[0]],
   [uids[1],uids[2]],[uids[2],uids[3]],[uids[3],uids[4]],[uids[4],uids[1]]
  ].forEach(f => { try { db.run('INSERT INTO followers (follower_id,following_id) VALUES (?,?)', f); } catch {} });

  console.log('✅ Database seeded with demo data');
}

function getLastId() {
  return db.exec('SELECT last_insert_rowid()')[0].values[0][0];
}

// Helper methods matching better-sqlite3 API style
function getDb() { return db; }

function prepare(sql) {
  return {
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        stmt.free();
        const row = {};
        cols.forEach((c, i) => row[c] = vals[i]);
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(...params) {
      const results = [];
      const stmt = db.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach((c, i) => row[c] = vals[i]);
        results.push(row);
      }
      stmt.free();
      return results;
    },
    run(...params) {
      db.run(sql, params);
      save();
      return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0], changes: db.getRowsModified() };
    }
  };
}

module.exports = { initDB, prepare, save, getDb };
