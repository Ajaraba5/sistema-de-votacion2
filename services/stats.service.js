/**
 * Servicio de estadísticas
 * Conteos globales, por líder y por partido
 */

const db = require('../db/database.js')

class StatsService {

  // ==========================
  // ESTADÍSTICAS GENERALES
  // ==========================
  static getGlobalStats() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'voto' THEN 1 ELSE 0 END) AS votaron,
          SUM(CASE WHEN status = 'no_voto' THEN 1 ELSE 0 END) AS no_votaron,
          SUM(CASE WHEN status = 'no_llego' THEN 1 ELSE 0 END) AS no_llegaron
        FROM voters
        `,
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows[0])
        }
      )
    })
  }

  // ==========================
  // ESTADÍSTICAS POR LÍDER
  // ==========================
  static getStatsByLeader() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT
          u.id AS leader_id,
          u.username AS leader,
          COUNT(v.id) AS total,
          SUM(CASE WHEN v.status = 'voto' THEN 1 ELSE 0 END) AS votaron,
          SUM(CASE WHEN v.status = 'no_voto' THEN 1 ELSE 0 END) AS no_votaron,
          SUM(CASE WHEN v.status = 'no_llego' THEN 1 ELSE 0 END) AS no_llegaron
        FROM users u
        LEFT JOIN voters v ON v.leader_id = u.id
        WHERE u.role = 'leader'
        GROUP BY u.id
        `,
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
        SELECT
          party,
          SUM(CASE WHEN status = 'voto' THEN 1 ELSE 0 END) AS votaron,
          SUM(CASE WHEN status = 'no_voto' THEN 1 ELSE 0 END) AS no_votaron,
          SUM(CASE WHEN status = 'no_llego' THEN 1 ELSE 0 END) AS no_llegaron,
          COUNT(*) AS total
        FROM voters
        GROUP BY party
        `,
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  }

  // ==========================
  // ESTADÍSTICAS DE UN LÍDER
  // ==========================
  static getLeaderStats(leaderId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT
          status,
          COUNT(*) AS total
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

}

module.exports = StatsService
