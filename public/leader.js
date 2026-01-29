/* ===============================
   CARGAR VOTANTES DEL LÍDER
================================ */
async function loadVoters() {
  try {
    const res = await fetch('/leader/voters')
    if (!res.ok) throw new Error('No autorizado')

    const voters = await res.json()

    const tbody = document.getElementById('votersTable')
    tbody.innerHTML = ''

    let voted = 0
    let pending = 0

    voters.forEach(v => {
      if (v.status === 'Votó') voted++
      else pending++

      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${v.name}</td>
        <td>
          <select onchange="updateStatus(${v.id}, this.value)">
            <option value="No votó" ${v.status === 'No votó' ? 'selected' : ''}>No votó</option>
            <option value="Votó" ${v.status === 'Votó' ? 'selected' : ''}>Votó</option>
            <option value="No llegó" ${v.status === 'No llegó' ? 'selected' : ''}>No llegó</option>
          </select>
        </td>
      `
      tbody.appendChild(tr)
    })

    document.getElementById('total').innerText = voters.length
    document.getElementById('voted').innerText = voted
    document.getElementById('pending').innerText = pending

  } catch (err) {
    console.error('Error cargando votantes del líder')
  }
}

/* ===============================
   ACTUALIZAR ESTADO
================================ */
async function updateStatus(voterId, status) {
  try {
    await fetch(`/leader/voters/${voterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
  } catch (err) {
    console.error('Error actualizando estado')
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
loadVoters()

// Refresco automático
setInterval(loadVoters, 4000)
<script src="/public/js/leader.js"></script>
