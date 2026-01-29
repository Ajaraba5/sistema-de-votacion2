let leaders = []
let chartGeneral = null
let chartA = null
let chartB = null

async function loadStats(party = null) {
  let url = '/admin/stats'
  if(party) url += `?party=${party}`

  const res = await fetch(url)
  if(!res.ok) return

  const data = await res.json()

  if(!party) {
    document.getElementById('total').innerText = data.total
    document.getElementById('voted').innerText = data.voted
    document.getElementById('notVoted').innerText = data.notVoted
    document.getElementById('absent').innerText = data.absent
  }

  const ctxId = party === 'A' ? 'chartA' : party === 'B' ? 'chartB' : 'chartGeneral'
  const ctx = document.getElementById(ctxId)
  
  let chartObj = ctxId === 'chartGeneral' ? chartGeneral : ctxId === 'chartA' ? chartA : chartB
  if(chartObj) chartObj.destroy()

  const newChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Votaron', 'No votaron', 'No llegaron'],
      datasets: [{
        data: [data.voted, data.notVoted, data.absent],
        backgroundColor: ['#22c55e','#facc15','#ef4444']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#fff' }
        }
      }
    }
  })

  if(ctxId === 'chartGeneral') chartGeneral = newChart
  if(ctxId === 'chartA') chartA = newChart
  if(ctxId === 'chartB') chartB = newChart
}

// Cargar todas las estadísticas
function loadAllStats() {
  loadStats()      // General
  loadStats('A')   // Partido A
  loadStats('B')   // Partido B
}

// AUTOLOAD
window.onload = () => {
  loadAllStats()
}


/* ===============================
   RENDERIZAR GRÁFICO
================================ */
function renderChart(data, party) {
  const ctxId = party === 'A' ? 'chartA' : party === 'B' ? 'chartB' : 'chartGeneral'
  const ctx = document.getElementById(ctxId)

  // Seleccionar la variable correcta según el gráfico
  let chartObj
  if (ctxId === 'chartGeneral') chartObj = chartGeneral
  else if (ctxId === 'chartA') chartObj = chartA
  else chartObj = chartB

  // Destruir el gráfico anterior si existe
  if (chartObj) chartObj.destroy()

  // Crear nuevo gráfico
  const newChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Votaron', 'No votaron', 'No llegaron'],
      datasets: [{
        data: [data.voted, data.notVoted, data.absent],
        backgroundColor: ['#22c55e', '#facc15', '#ef4444']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#ffffff' },
          position: 'bottom'
        },
        title: {
          display: true,
          text: ctxId === 'chartGeneral' ? 'Resultados Generales' :
                ctxId === 'chartA' ? 'Resultados Partido A' : 'Resultados Partido B',
          color: '#ffffff',
          font: { size: 16 }
        }
      }
    }
  })

  // Guardar gráfico en la variable correcta
  if (ctxId === 'chartGeneral') chartGeneral = newChart
  else if (ctxId === 'chartA') chartA = newChart
  else chartB = newChart
}

/* ===============================
   CARGAR TODAS LAS ESTADÍSTICAS
================================ */
function loadAllStats() {
  loadStats()       // General
  loadStats('A')    // Partido A
  loadStats('B')    // Partido B
}

/* ===============================
   CARGAR VOTANTES
================================ */
async function loadVoters() {
  try {
    const res = await fetch('/admin/voters')
    if (!res.ok) throw new Error('No autorizado')

    const voters = await res.json()
    const tbody = document.getElementById('votersTable')
    tbody.innerHTML = ''

    voters.forEach(v => {
      const tr = document.createElement('tr')

      let leaderOptions = leaders.map(l =>
        `<option value="${l.id}" ${v.leader == l.username ? 'selected' : ''}>${l.username}</option>`
      ).join('')

      tr.innerHTML = `
        <td>${v.name}</td>
        <td>${v.cedula}</td>
        <td>${v.phone || '-'}</td>
        <td>${v.party}</td>
        <td>
          <select onchange="assignLeader(${v.id}, this.value)">
            <option value="">-- Sin líder --</option>
            ${leaderOptions}
          </select>
        </td>
        <td>${v.status}</td>
      `
      tbody.appendChild(tr)
    })
  } catch (err) {
    console.error('Error cargando votantes', err)
  }
}

/* ===============================
   ASIGNAR LÍDER
================================ */
async function assignLeader(voterId, leaderId) {
  try {
    await fetch('/admin/assign-voters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voter_ids: [voterId], leader_id: leaderId })
    })
    loadVoters()
  } catch (err) {
    console.error('Error asignando líder', err)
  }
}

/* ===============================
   BUSCAR VOTANTE POR CÉDULA
================================ */
async function searchVoter() {
  const cedula = document.getElementById('searchCedula').value.trim()
  if (!cedula) return alert('Ingrese una cédula válida')

  try {
    const res = await fetch(`/admin/voters/search?cedula=${encodeURIComponent(cedula)}`)
    if (!res.ok) throw new Error('No autorizado')

    const voters = await res.json()
    const tbody = document.getElementById('votersTable')
    tbody.innerHTML = ''

    if (voters.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No se encontró ningún votante</td></tr>'
      return
    }

    voters.forEach(v => {
      const tr = document.createElement('tr')
      let leaderOptions = leaders.map(l =>
        `<option value="${l.id}" ${v.leader == l.username ? 'selected' : ''}>${l.username}</option>`
      ).join('')

      tr.innerHTML = `
        <td>${v.name}</td>
        <td>${v.cedula}</td>
        <td>${v.phone || '-'}</td>
        <td>${v.party}</td>
        <td>
          <select onchange="assignLeader(${v.id}, this.value)">
            <option value="">-- Sin líder --</option>
            ${leaderOptions}
          </select>
        </td>
        <td>${v.status}</td>
      `
      tbody.appendChild(tr)
    })
  } catch (err) {
    console.error('Error buscando votante', err)
  }
}

/* ===============================
   CARGAR LÍDERES
================================ */
async function loadLeaders() {
  try {
    const res = await fetch('/admin/leaders')
    if (!res.ok) throw new Error('No autorizado')

    leaders = await res.json()
    const ul = document.getElementById('leadersList')
    ul.innerHTML = ''

    leaders.forEach(l => {
      const li = document.createElement('li')
      li.innerText = `${l.username} (ID: ${l.id})`
      ul.appendChild(li)
    })

    loadVoters()
  } catch (err) {
    console.error('Error cargando líderes', err)
  }
}

/* ===============================
   LOGOUT
================================ */
async function logout() {
  await fetch('/auth/logout')
  window.location.href = '/'
}

/* ===============================
   INIT
================================ */
loadAllStats()
loadLeaders()

// Actualización automática cada 5 segundos
setInterval(() => {
  loadAllStats()
  loadVoters()
}, 5000)
