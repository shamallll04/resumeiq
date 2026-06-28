import { createRequire } from 'module';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const initSqlJs = require('sql.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'resumeiq.db');

let _db = null;
let SQL = null;

export async function getDb() {
  if (_db) return _db;
  SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const buf = readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  _db.run(`PRAGMA foreign_keys = ON;`);

  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      company_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS job_postings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      department TEXT DEFAULT '',
      description TEXT DEFAULT '',
      min_score INTEGER DEFAULT 70,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS criteria (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      text TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Skills',
      weight INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS applicants (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      cv_text TEXT NOT NULL,
      cv_filename TEXT,
      score INTEGER,
      tier TEXT,
      analysis_json TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  save();
  return _db;
}

export function save() {
  if (!_db) return;
  const data = _db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper: run a query and return all rows as objects
export function all(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  } catch { return []; }
}

// Helper: return first row
export function get(db, sql, params = []) {
  const rows = all(db, sql, params);
  return rows[0] || null;
}

// Helper: run insert/update/delete
export function run(db, sql, params = []) {
  db.run(sql, params);
  save();
}
