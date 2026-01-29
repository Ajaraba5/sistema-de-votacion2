/**
 * Seed inicial del sistema
 * Crea el usuario Administrador
 */

const bcrypt = require('bcryptjs')
const db = require('./database')

const ADMIN_USER = {
  username: 'admin',
  password: 'admin123',
  role: 'admin'
}

db.serialize(() => {

  console.log('🌱 Ejecutando seed...')

  db.get(
    'SELECT id FROM users WHERE username = ?',
    [ADMIN_USER.username],
    (err, row) => {
      if (err) {
        console.error('❌ Error al verificar admin:', err.message)
        process.exit(1)
      }

      if (row) {
        console.log('ℹ️ El usuario admin ya existe')
        process.exit(0)
      }

      const hashedPassword = bcrypt.hashSync(ADMIN_USER.password, 10)

      db.run(
        `INSERT INTO users (username, password, role)
         VALUES (?, ?, ?)`,
        [ADMIN_USER.username, hashedPassword, ADMIN_USER.role],
        function (err) {
          if (err) {
            console.error('❌ Error al crear admin:', err.message)
          } else {
            console.log('👑 Usuario admin creado correctamente')
            console.log('👉 Usuario: admin')
            console.log('👉 Contraseña: admin123')
            console.log('🆔 ID:', this.lastID)
          }
          process.exit(0)
        }
      )
    }
  )

})
