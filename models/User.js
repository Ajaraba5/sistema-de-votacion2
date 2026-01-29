/**
 * Modelo User
 * Maneja administradores y líderes
 */

const db = require('../db/database')
const bcrypt = require('bcryptjs')

class User {

  // ==========================
  // CREAR USUARIO
  // ==========================
  static create({ username, password, role }) {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(password, 10)

      const sql = `
        INSERT INTO users (username, password, role)
        VALUES (?, ?, ?)
      `

      db.run(sql, [username, hashedPassword, role], function (err) {
        if (err) return reject(err)
        resolve({ id: this.lastID, username, role })
      })
    })
  }

  // ==========================
  // BUSCAR POR USERNAME
  // ==========================
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE username = ?`,
        [username],
        (err, row) => {
          if (err) return reject(err)
          resolve(row)
        }
      )
    })
  }

  // ==========================
  // BUSCAR POR ID
  // ==========================
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, username, role FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) return reject(err)
          resolve(row)
        }
      )
    })
  }

  // ==========================
  // LISTAR LÍDERES
  // ==========================
  static getLeaders() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, username FROM users WHERE role = 'leader'`,
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  }

  // ==========================
  // ELIMINAR USUARIO
  // ==========================
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM users WHERE id = ?`,
        [id],
        (err) => {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  }

}

module.exports = User
    