const express = require('express')
const router = express.Router()

const db = require('../db/database.js')
const auth = require('../middlewares/auth.js')
const role = require('../middlewares/role.js')

const ExcelService = require('../services/excel.service.js')

const multer = require('multer')
const XLSX = require('xlsx')
const fs = require('fs')
const bcrypt = require('bcryptjs')

const upload = multer({ dest: 'uploads/' })

/* ===============================
   SEGURIDAD ADMIN
================================ */
router.use(auth)
router.use(role('admin'))

/* ===============================
   PANEL ADMIN
================================ */
router.get('/', (req, res) => {
  res.sendFile('admin.html', { root: 'views' })
})

/* ===============================
   ESTADÍSTICAS (GENERAL O POR PARTIDO)
================================ */
router.get('/stats', (req, res) => {
  const partyFilter = req.query.party  // puede ser 'A', 'B' o undefined
  let query = `SELECT status, COUNT(*) as total FROM voters`
  let params = []

  if(partyFilter) {
    query += ` WHERE party = ?`
    params.push(partyFilter)
  }

  query += ` GROUP BY status`

  db.all(query, params, (err, rows) => {
    if(err) return res.status(500).json(err)

    const stats = { total: 0, voted: 0, notVoted: 0, absent: 0 }
    rows.forEach(r => {
      stats.total += r.total
      if(r.status === 'voto') stats.voted = r.total
      if(r.status === 'no_voto') stats.notVoted = r.total
      if(r.status === 'no_llego') stats.absent = r.total
    })

    res.json(stats)
  })
})

/* ===============================
   LISTADO COMPLETO DE VOTANTES
================================ */
router.get('/voters', (req, res) => {
  db.all(
    `SELECT 
       v.id,
       v.name,
       v.cedula,
       v.phone,
       v.party,
       v.status,
       u.username AS leader
     FROM voters v
     LEFT JOIN users u ON v.leader_id = u.id`,
    (err, rows) => {
      if(err) return res.status(500).json(err)
      res.json(rows)
    }
  )
})

/* ===============================
   BUSCAR VOTANTE POR CÉDULA
================================ */
router.get('/voters/search', (req, res) => {
  const cedula = req.query.cedula
  if(!cedula) return res.status(400).json([])

  db.all(
    `SELECT 
       v.id,
       v.name,
       v.cedula,
       v.phone,
       v.party,
       v.status,
       u.username AS leader
     FROM voters v
     LEFT JOIN users u ON v.leader_id = u.id
     WHERE v.cedula = ?`,
    [cedula],
    (err, rows) => {
      if(err) return res.status(500).json([])
      res.json(rows)
    }
  )
})

/* ===============================
   EXPORTAR EXCEL (CSV)
================================ */
const path = require('path');

router.get('/export/excel', async (req, res) => {
  try {
    const party = req.query.party; // 'A', 'B' o undefined

    // Consulta base de datos
    let query = `SELECT name, cedula, phone, party, status FROM voters`;
    const params = [];
    if(party) {
      query += ` WHERE party = ?`;
      params.push(party);
    }

    db.all(query, params, (err, rows) => {
      if(err) {
        console.error(err);
        return res.status(500).json({ error: 'Error consultando la base de datos' });
      }

      if(!rows || rows.length === 0) {
        return res.status(404).json({ error: 'No hay datos para exportar' });
      }

      // Construir CSV
      const headers = ['Nombre', 'Cédula', 'Teléfono', 'Partido', 'Estado'];
      const csvRows = [
        headers.join(','), // primera fila con headers
        ...rows.map(r => 
          [r.name, r.cedula, r.phone || '', r.party, r.status]
            .map(field => `"${field}"`) // envolver cada campo en comillas
            .join(',')
        )
      ];
      const csvContent = csvRows.join('\n');

      // Enviar CSV como descarga
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="votantes.csv"');
      res.send(csvContent);
    });

  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando CSV' });
  }
});


/* ===============================
   IMPORTAR EXCEL
================================ */
router.post('/import', upload.single('file'), (req, res) => {
  try {
    if(!req.file) return res.status(400).json({ error: 'No llegó ningún archivo' })
    console.log('📥 Archivo recibido:', req.file)

    const workbook = XLSX.readFile(req.file.path)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet)

    if(data.length === 0) return res.status(400).json({ error: 'El Excel está vacío' })

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO voters
      (name, cedula, phone, party, leader_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    let inserted = 0
    data.forEach(v => {
      stmt.run(
        v.name,
        v.cedula,
        v.phone || null,
        v.party,
        v.leader_id || null,
        v.status || 'no_voto'
      )
      inserted++
    })

    stmt.finalize()
    fs.unlinkSync(req.file.path)
    console.log(`✅ ${inserted} votantes importados`)
    res.json({ total: inserted })

  } catch(error) {
    console.error('❌ Error importando Excel:', error)
    res.status(500).json({ error: 'Error al importar Excel' })
  }
})

/* ===============================
   CREAR LÍDER
================================ */
router.post('/leaders', (req, res) => {
  const { username, password } = req.body
  if(!username || !password) return res.status(400).json({ error: 'Faltan campos' })

  const hashedPassword = bcrypt.hashSync(password, 10)

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, 'leader')`,
    [username, hashedPassword],
    function(err) {
      if(err) {
        console.error(err)
        return res.status(500).json({ error: 'Error creando líder' })
      }
      res.json({ message: 'Líder creado', id: this.lastID })
    }
  )
})

/* ===============================
   LISTAR LÍDERES
================================ */
router.get('/leaders', (req, res) => {
  db.all(`SELECT id, username FROM users WHERE role='leader'`, (err, rows) => {
    if(err) return res.status(500).json({ error: 'Error al listar líderes' })
    res.json(rows)
  })
})

/* ===============================
   ASIGNAR UN VOTANTE A UN LÍDER (INDIVIDUAL)
================================ */
router.post('/assign', (req, res) => {
  const { voter_id, leader_id } = req.body
  if(!voter_id) return res.status(400).json({ error: 'Falta el votante' })

  const lid = leader_id || null
  db.run(`UPDATE voters SET leader_id = ? WHERE id = ?`, [lid, voter_id], function(err) {
    if(err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Votante asignado correctamente' })
  })
})

/* ===============================
   ASIGNAR VOTANTES A LÍDER (MÚLTIPLES)
================================ */
router.post('/assign-voters', (req, res) => {
  const { leader_id, voter_ids } = req.body
  if(!leader_id || !voter_ids || !Array.isArray(voter_ids)) {
    return res.status(400).json({ error: 'Faltan datos' })
  }

  const stmt = db.prepare(`UPDATE voters SET leader_id = ? WHERE id = ?`)
  voter_ids.forEach(voter_id => stmt.run(leader_id, voter_id))
  stmt.finalize(err => {
    if(err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Votantes asignados correctamente' })
  })
})

/* ===============================
   ACTUALIZAR ESTADO DE VOTANTE
================================ */
router.post('/voters/:id/status', (req, res) => {
  const voterId = req.params.id
  const { status } = req.body

  if(!['voto','no_voto','no_llego'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' })
  }

  db.run(`UPDATE voters SET status = ? WHERE id = ?`, [status, voterId], function(err) {
    if(err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Estado actualizado' })
  })
})
/* ===============================
   ESTADÍSTICAS DE UN LÍDER
================================ */
router.get('/leader/:id/stats', (req, res) => {
  const leaderId = req.params.id

  db.all(
    `SELECT status, COUNT(*) as total
     FROM voters
     WHERE leader_id = ?
     GROUP BY status`,
    [leaderId],
    (err, rows) => {
      if(err) return res.status(500).json(err)

      const stats = { total: 0, voted: 0, notVoted: 0, absent: 0 }
      rows.forEach(r => {
        stats.total += r.total
        if(r.status === 'voto') stats.voted = r.total
        if(r.status === 'no_voto') stats.notVoted = r.total
        if(r.status === 'no_llego') stats.absent = r.total
      })

      res.json(stats)
    }
  )
})

/* ===============================
   LISTADO DE VOTANTES DE UN LÍDER
================================ */
router.get('/leader/:id/voters', (req, res) => {
  const leaderId = req.params.id

  db.all(
    `SELECT id, name, cedula, phone, party, status
     FROM voters
     WHERE leader_id = ?`,
    [leaderId],
    (err, rows) => {
      if(err) return res.status(500).json(err)
      res.json(rows)
    }
  )
})

module.exports = router
