/**
 * Servicio de asignación automática de votantes a líderes
 * Reparte de forma balanceada
 */

const db = require('../db/database.js')

class AssignService {

  /**
   * Asigna votantes SIN líder a una lista de líderes
   * @param {Array} leaders [{ id }]
   */
  static assignUnassignedVoters(leaders) {
    return new Promise((resolve, reject) => {

      if (!leaders || leaders.length === 0) {
        return reject(new Error('No hay líderes disponibles'))
      }

      // 1️⃣ Obtener votantes sin líder
      db.all(
        `SELECT id FROM voters WHERE leader_id IS NULL`,
        (err, voters) => {
          if (err) return reject(err)

          if (voters.length === 0) {
            return resolve({ assigned: 0 })
          }

          let leaderIndex = 0
          let assignedCount = 0

          db.serialize(() => {
            voters.forEach(voter => {
              const leader = leaders[leaderIndex]

              db.run(
                `UPDATE voters SET leader_id = ? WHERE id = ?`,
                [leader.id, voter.id]
              )

              assignedCount++
              leaderIndex = (leaderIndex + 1) % leaders.length
            })
          })

          resolve({ assigned: assignedCount })
        }
      )
    })
  }

  /**
   * Reasignar todos los votantes (RESET + BALANCEO)
   */
  static reassignAll(leaders) {
    return new Promise((resolve, reject) => {

      if (!leaders || leaders.length === 0) {
        return reject(new Error('No hay líderes disponibles'))
      }

      db.serialize(() => {

        // 1️⃣ Limpiar líderes
        db.run(`UPDATE voters SET leader_id = NULL`)

        // 2️⃣ Obtener todos los votantes
        db.all(`SELECT id FROM voters`, (err, voters) => {
          if (err) return reject(err)

          let leaderIndex = 0

          voters.forEach(voter => {
            const leader = leaders[leaderIndex]

            db.run(
              `UPDATE voters SET leader_id = ? WHERE id = ?`,
              [leader.id, voter.id]
            )

            leaderIndex = (leaderIndex + 1) % leaders.length
          })

          resolve({ assigned: voters.length })
        })
      })
    })
  }

}

module.exports = AssignService
