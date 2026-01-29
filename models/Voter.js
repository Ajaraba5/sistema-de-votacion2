/**
 * Modelo Voter
 * Manejo completo de votantes
 */

const db = require('../db/database.js')

class Voter {

  // ==========================
  // CREAR VOTANTE
  // ==========================
  static create({ name, cedula, phone, party, leader_id }) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO voters (name, cedula, phone, party, leader_id)
        VALUES (?, ?, ?, ?, ?)
      `

      db.run(
        sql,
        [name, cedula, phone, party, leader_id],
        function (err) {
          if (err) return reject(err)
          resolve({
            id: this.lastID,
            name,
            cedula,
            phone,
            party,
            leader_id,
            status: 'no_voto'
          })
        }
      )
    })
  }

  // ==========================
  // LISTAR TODOS (ADMIN)
  // ==========================
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT v.*, u.username AS leader
        FROM voters v
        LEFT JOIN users u ON v.leader_id = u.id
        `,
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  }

  // ==========================
  // LISTAR POR LÍDER
  // ==========================
  static getByLeader(leaderId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM voters WHERE leader_id = ?`,
        [leaderId],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  }

  // ==========================
  // ACTUALIZAR ESTADO DE VOTO
  // ==========================
  static updateStatus(voterId, leaderId, status) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE voters
        SET status = ?
        WHERE id = ? AND leader_id = ?
      `

      db.run(sql, [status, voterId, leaderId], function (err) {
        if (err) return reject(err)
        resolve(this.changes > 0)
      })
    })
  }

  // ==========================
  // ESTADÍSTICAS GENERALES
  // ==========================
  static getStats() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT status, COUNT(*) as total
        FROM voters
        GROUP BY status
        `,
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  }

  // ==========================
  // ESTADÍSTICAS POR LÍDER
  // ==========================
  static getStatsByLeader(leaderId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT status, COUNT(*) as total
        FROM voters
        WHERE leader_id = ?
        GROUP BY status
        `,
        [leaderId],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  }

  // ==========================
  // ESTADÍSTICAS POR PARTIDO
  // ==========================
  static getStatsByParty() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT party, status, COUNT(*) as total
        FROM voters
        GROUP BY party, status
        `,
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  }

  // ==========================
  // RESET GENERAL (ADMIN)
  // ==========================
  static resetAll() {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE voters SET status = 'no_voto'`,
        function (err) {
          if (err) return reject(err)
          resolve(this.changes)
        }
      )
    })
  }

}

module.exports = Voter
