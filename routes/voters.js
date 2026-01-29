/**
 * Rutas CRUD de votantes
 * Admin: control total
 * Líder: solo lectura de los suyos
 */

const express = require('express')
const auth = require('../middlewares/auth.js')
const role = require('../middlewares/role.js')

const Voter = require('../models/Voter.js')

const router = express.Router()

// ==========================
// MIDDLEWARE GLOBAL
// ==========================
router.use(auth)

// ==========================
// CREAR VOTANTE (ADMIN)
// ==========================
router.post('/', role('admin'), async (req, res) => {
  const { name, cedula, phone, party, leader_id } = req.body

  if (!name || !cedula || !party) {
    return res.status(400).json({ error: 'Datos incompletos' })
  }

  try {
    const voter = await Voter.create({
      name,
      cedula,
      phone,
      party,
      leader_id
    })

    res.json({ ok: true, voter })
  } catch (error) {
    res.status(400).json({ error: 'Error al crear votante' })
  }
})

// ==========================
// LISTAR VOTANTES
// ==========================
router.get('/', async (req, res) => {
  try {
    // Admin ve todos
    if (req.session.user.role === 'admin') {
      const voters = await Voter.getAll()
      return res.json(voters)
    }

    // Líder ve solo los suyos
    if (req.session.user.role === 'leader') {
      const voters = await Voter.getByLeader(req.session.user.id)
      return res.json(voters)
    }

    res.status(403).json({ error: 'No autorizado' })
  } catch (error) {
    res.status(500).json({ error: 'Error al listar votantes' })
  }
})

// ==========================
// ACTUALIZAR VOTANTE (ADMIN)
// ==========================
router.put('/:id', role('admin'), async (req, res) => {
  res.status(501).json({
    error: 'Edición de votante pendiente (opcional)'
  })
})

// ==========================
// ELIMINAR VOTANTE (ADMIN)
// ==========================
router.delete('/:id', role('admin'), async (req, res) => {
  res.status(501).json({
    error: 'Eliminación de votante pendiente (opcional)'
  })
})

module.exports = router
