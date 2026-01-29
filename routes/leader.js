/**
 * Rutas del Líder
 * Solo puede ver y modificar SUS votantes
 */

const express = require('express')
const auth = require('../middlewares/auth.js')
const role = require('../middlewares/role.js')

const Voter = require('../models/Voter.js')

const router = express.Router()

// ==========================
// MIDDLEWARES
// ==========================
router.use(auth)
router.use(role('leader'))

// ==========================
// PANEL DEL LÍDER
// ==========================
router.get('/', (req, res) => {
  res.sendFile('leader.html', { root: 'views' })
})

// ==========================
// OBTENER MIS VOTANTES
// ==========================
router.get('/voters', async (req, res) => {
  try {
    const leaderId = req.session.user.id
    const voters = await Voter.getByLeader(leaderId)
    res.json(voters)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener votantes' })
  }
})

// ==========================
// ESTADÍSTICAS DEL LÍDER
// ==========================
router.get('/stats', async (req, res) => {
  try {
    const leaderId = req.session.user.id
    const stats = await Voter.getStatsByLeader(leaderId)

    // Aseguramos que siempre haya los campos
    const response = {
      total: stats.total || 0,
      voted: stats.voted || 0,
      notVoted: stats.notVoted || 0,
      absent: stats.absent || 0
    }

    res.json(response)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// ==========================
// CAMBIAR ESTADO DE VOTO
// ==========================
router.post('/vote/:id', async (req, res) => {
  const { status } = req.body
  const voterId = req.params.id
  const leaderId = req.session.user.id

  if (!['no_voto', 'voto', 'no_llego'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' })
  }

  try {
    const updated = await Voter.updateStatus(voterId, leaderId, status)

    if (!updated) {
      return res.status(403).json({ error: 'No autorizado para modificar este votante' })
    }

    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar estado del votante' })
  }
})

module.exports = router
