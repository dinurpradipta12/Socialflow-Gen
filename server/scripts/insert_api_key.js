const crypto = require('crypto');
const sqlite3 = require('sqlite3');
const path = require('path');
require('dotenv').config();

const APP_ID = process.argv[2] || process.env.APP_ID;
const API_KEY = process.argv[3] || process.env.API_KEY;
const WEBHOOK_URL = process.argv[4] || process.env.WEBHOOK_URL || null;
const NAME = process.argv[5] || process.env.APP_NAME || null;

function getKey() {
  const k = process.env.ENCRYPTION_KEY || '';
  if (!k || Buffer.from(k, 'utf8').length < 32) throw new Error('ENCRYPTION_KEY must be set and 32 bytes');
  return Buffer.from(k, 'utf8').slice(0, 32);
}

function encryptText(plain) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

if (!APP_ID || !API_KEY) {
  console.error('Usage: node scripts/insert_api_key.js <APP_ID> <API_KEY> [WEBHOOK_URL] [NAME]');
  process.exit(2);
}

const dbPath = path.resolve(__dirname, '../data.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT UNIQUE NOT NULL,
    name TEXT,
    webhook_url TEXT,
    api_key_encrypted TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const encrypted = encryptText(API_KEY);

  db.get('SELECT * FROM apps WHERE app_id = ?', [APP_ID], (err, row) => {
    if (err) { console.error(err); process.exit(1); }
    if (row) {
      db.run('UPDATE apps SET api_key_encrypted = ?, webhook_url = ?, name = ? WHERE app_id = ?', [encrypted, WEBHOOK_URL, NAME, APP_ID], function(e) {
        if (e) console.error(e);
        else console.log(`Updated app ${APP_ID} with encrypted API key.`);
        db.close();
      });
    } else {
      db.run('INSERT INTO apps (app_id, name, webhook_url, api_key_encrypted) VALUES (?, ?, ?, ?)', [APP_ID, NAME, WEBHOOK_URL, encrypted], function(e) {
        if (e) console.error(e);
        else console.log(`Inserted app ${APP_ID} with encrypted API key.`);
        db.close();
      });
    }
  });
});
