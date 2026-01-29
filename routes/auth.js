/**
 * Rutas de autenticación
 * Login / Logout
 */

const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')


const router = express.Router()

// ==========================
// LOGIN
// ==========================
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Datos incompletos' })
  }

  try {
    const user = await User.findByUsername(username)

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    const validPassword = bcrypt.compareSync(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    // Guardar sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    }

    return res.json({
      ok: true,
      role: user.role
    })

  } catch (error) {
    console.error('❌ Error login:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ==========================
// LOGOUT
// ==========================
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo cerrar sesión' })
    }

    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

// ==========================
// SESIÓN ACTIVA
// ==========================
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ logged: false })
  }

  res.json({
    logged: true,
    user: req.session.user
  })
})

module.exports = router
