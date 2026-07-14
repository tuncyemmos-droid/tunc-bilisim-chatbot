// db.js
// SQLite veritabanı bağlantısı ve şema tanımı.
// Node.js'in kendi built-in `node:sqlite` modülünü kullanıyoruz (Node 22.5+'ta
// eklendi, Node 26'da tam kararlı) - böylece better-sqlite3 gibi native
// derleme gerektiren bir pakete ihtiyaç kalmıyor.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'nextreach.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    need_summary TEXT,
    urgency TEXT CHECK(urgency IN ('hemen', 'bu_hafta', 'sadece_bilgi', NULL)),
    email TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    raw_conversation TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    session_id TEXT PRIMARY KEY,
    stage TEXT DEFAULT 'greeting',
    name TEXT,
    need_summary TEXT,
    urgency TEXT,
    email TEXT,
    messages TEXT DEFAULT '[]',
    need_question_count INTEGER DEFAULT 0,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;