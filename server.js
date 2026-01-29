// ==========================
// IMPORTS
// ==========================
const express = require('express')
const session = require('express-session')
const path = require('path')

// Inicializa DB
require('./db/database')

// Rutas
const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const leaderRoutes = require('./routes/leader')
const voterRoutes = require('./routes/voters')

// ==========================
// APP
// ==========================
const app = express()

// ==========================
// MIDDLEWARES GLOBALES
// ==========================
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    secret: 'sistema_votacion_super_secreto',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 6 } // 6 horas
  })
)

// 🔍 LOG TEMPORAL
app.use((req, res, next) => {
  console.log(req.method, req.url)
  next()
})

// ==========================
// ARCHIVOS ESTÁTICOS
// ==========================
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/views', express.static(path.join(__dirname, 'views')))

// ==========================
// RUTAS
// ==========================
app.use('/auth', authRoutes)
app.use('/admin', adminRoutes)
app.use('/leader', leaderRoutes)
app.use('/voters', voterRoutes)

// ==========================
// RUTA PRINCIPAL
// ==========================
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.sendFile(path.join(__dirname, 'views/login.html'))
  }

  // Redirigir según rol
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin')
  }

  if (req.session.user.role === 'leader') {
    return res.redirect('/leader')
  }

  res.status(403).send('Acceso no autorizado')
})

// ==========================
// MANEJO DE ERRORES
// ==========================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// ==========================
// SERVER
// ==========================
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Sistema de votación corriendo en http://localhost:${PORT}`)
})
