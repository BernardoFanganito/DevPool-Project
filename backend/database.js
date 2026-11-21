const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function conectarBanco() {
  const db = await open({
    filename: './banco.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      login TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);

  return db;
}

module.exports = conectarBanco;