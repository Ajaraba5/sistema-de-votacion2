const XLSX = require('xlsx')
const db = require('../db/database.js')
const path = require('path')

class ExcelService {

  static exportVoters() {
    return new Promise((resolve, reject) => {

      db.all(`
        SELECT 
          v.name,
          v.cedula,
          v.phone,
          v.party,
          u.username AS leader,
          v.status
        FROM voters v
        LEFT JOIN users u ON v.leader_id = u.id
      `, (err, rows) => {
        if (err) return reject(err)

        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Votantes')

        const filePath = path.join(__dirname, '../exports/voters.xlsx')
        XLSX.writeFile(workbook, filePath)

        resolve(filePath)
      })
    })
  }

}

module.exports = ExcelService
