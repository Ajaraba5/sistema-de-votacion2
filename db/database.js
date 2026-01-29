/**
 * Conexión y estructura de la base de datos SQLite
 * Sistema de Votación Web
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const bcrypt = require('bcryptjs')

// ==========================
// RUTA DB
// ==========================
const dbPath = path.join(__dirname, 'database.db')

// ==========================
// CONEXIÓN
// ==========================
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar DB:', err.message)
  } else {
    console.log('✅ Base de datos SQLite conectada')
  }
})

// ==========================
// CREACIÓN DE TABLAS
// ==========================
db.serialize(() => {
  // --------------------------
  // USERS
  // --------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','leader'))
    )
  `, (err) => {
    if (err) console.error('❌ Error creando tabla users:', err.message)
  })

  // --------------------------
  // VOTERS
  // --------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS voters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cedula TEXT UNIQUE NOT NULL,
      phone TEXT,
      party TEXT CHECK (party IN ('A', 'B')) NOT NULL DEFAULT 'A',
      leader_id INTEGER,
      status TEXT CHECK (status IN ('no_voto','voto','no_llego')) NOT NULL DEFAULT 'no_voto',
      FOREIGN KEY (leader_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('❌ Error creando tabla voters:', err.message)
  })

  // --------------------------
  // ÍNDICES (rendimiento)
  // --------------------------
  db.run(`CREATE INDEX IF NOT EXISTS idx_voters_leader ON voters(leader_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_voters_status ON voters(status)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_voters_party ON voters(party)`)

  // --------------------------
  // ADMIN INICIAL
  // --------------------------
  const adminPassword = bcrypt.hashSync('admin123', 10)
  db.run(`
    INSERT OR IGNORE INTO users (username, password, role)
    VALUES ('admin', ?, 'admin')
  `, [adminPassword])
})

// ==========================
// EXPORTAR DB
// ==========================
module.exports = db
