const db = require('./database')

db.run(
  `INSERT INTO voters (name, cedula, phone, party, status)
   VALUES (?, ?, ?, ?, ?)`,
  ['Juan Pérez', '123456789', '3001234567', 'A', 'no_voto'],
  (err) => {
    if (err) {
      console.error(err.message)
    } else {
      console.log('✅ Votante insertado')
    }
    process.exit(0)
  }
)
