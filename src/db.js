import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "posts.db");

let _db = null;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    initSchema();
  }
  return _db;
}

function initSchema() {
  const db = _db;
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      title_zh TEXT DEFAULT '',
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT DEFAULT '',
      content TEXT DEFAULT '',
      content_zh TEXT DEFAULT '',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
      category TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
  `);

  // Create default admin if not exists (password: admin123)
  const hasAdmin = db.prepare("SELECT id FROM admin LIMIT 1").get();
  if (!hasAdmin) {
    const hash = "TODO: bcrypt hash"; // Will implement simple hash
    db.prepare("INSERT INTO admin (id, username, password_hash) VALUES (1, 'admin', ?)").run(
      "superk-cms-default-password"
    );
  }
}

export default getDb;
