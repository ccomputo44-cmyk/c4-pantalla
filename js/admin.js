/**
 * admin.js - Panel de Administración Autónomo conectado a Firebase
 * Incluye capa de datos y sincronización en tiempo real sin dependencias externas
 */

// URL DE TU BASE DE DATOS FIREBASE
const URL_FIREBASE = "https://c4-monitoreo-8d236-default-rtdb.firebaseio.com";

// ==========================================
// 1. CAPA DE COMUNICACIÓN CON FIREBASE
// ==========================================

async function obtenerActividades() {
  try {
    const respuesta = await fetch(`${URL_FIREBASE}/actividades.json`);
    const datos = await respuesta.json();
    if (!datos) return [];
    return Object.keys(datos).map(key => ({ id: key, ...datos[key] }));
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    return [];
  }
}

async function guardarActividadRemota(actividad) {
  try {
    const respuesta = await fetch(`${URL_FIREBASE}/actividades.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actividad)
    });
    return await respuesta.json();
  } catch (error) {
    console.error("Error al guardar actividad:", error);
    throw error;
  }
}

async function eliminarActividadRemota(id) {
  try {
    await fetch(`${URL_FIREBASE}/actividades/${id}.json`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    throw error;
  }
}

async function registrarEnBitacora(evento) {
  try {
    const registro = {
      folio: `BIT-${Date.now().toString().slice(-6)}`,
      fecha: new Date().toLocaleDateString('es-MX'),
      horaRegistro: new Date().toLocaleTimeString('es-MX', { hour12: false }),
      ...evento
    };
    await fetch(`${URL_FIREBASE}/bitacora.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registro)
    });
  } catch (error) {
    console.error("Error al registrar en bitácora:", error);
  }
}

async function obtenerBitacora() {
  try {
    const respuesta = await fetch(`${URL_FIREBASE}/bitacora.json`);
    const datos = await respuesta.json();
    if (!datos) return [];
    return Object.keys(datos).map(key => ({ idFirebase: key, ...datos[key] }));
  } catch (error) {
    console.error("Error al leer bitácora:", error);
    return [];
  }
}

// ==========================================
// 2. SESIÓN Y CONTROL DE ACCESO
// ==========================================

if (sessionStorage.getItem('c4_autenticado') !== 'true') {
  window.location.href = 'login.html';
}

function cerrarSesion() {
  sessionStorage.removeItem('c4_autenticado');
  window.location.href = '../index.html';
}

// ==========================================
// 3. CAPTURA Y FORMULARIO
// ==========================================

const form = document.getElementById('formularioCaptura');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const boton = form.querySelector('button[type="submit"]');
    const textoOriginal = boton ? boton.textContent : '';
    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Guardando en la nube...';
    }

    const nuevaActividad = {
      dia: document.getElementById('campoDia').value,
      inicio: document.getElementById('campoInicio').value,
      fin: document.getElementById('campoFin').value,
      nombre: document.getElementById('campoNombre').value.trim(),
      descripcion: document.getElementById('campoDescripcion').value.trim()
    };

    try {
      await guardarActividadRemota(nuevaActividad);
      alert('Actividad registrada exitosamente en la base de datos.');
      form.reset();
      await renderizarTablas();
    } catch (err) {
      alert('Error de conexión al guardar. Verifica tu acceso a internet.');
      console.error(err);
    } finally {
      if (boton) {
        boton.disabled = false;
        boton.textContent = textoOriginal;
      }
    }
  });
}

// ==========================================
// 4. RENDERIZADO DE TABLAS
// ==========================================

async function renderizarTablas() {
  await renderizarTablaActividades();
  await renderizarTablaBitacora();
}

async function renderizarTablaActividades() {
  const contenedor = document.getElementById('contenedorTablaActividades');
  if (!contenedor) return;

  contenedor.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">Consultando actividades en Firebase...</p>';

  const lista = await obtenerActividades();

  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="text-xs text-slate-500 py-4 text-center">No hay actividades registradas en la base de datos.</p>';
    return;
  }

  let html = `
    <table class="w-full text-left text-xs text-slate-300">
      <thead class="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
        <tr>
          <th class="p-3">Día</th>
          <th class="p-3">Horario</th>
          <th class="p-3">Actividad</th>
          <th class="p-3">Descripción</th>
          <th class="p-3 text-right">Acción</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/80">
  `;

  lista.forEach(act => {
    html += `
      <tr class="hover:bg-slate-900/40">
        <td class="p-3 font-bold text-white">${act.dia}</td>
        <td class="p-3 font-mono text-sky-400 font-bold">${act.inicio} - ${act.fin}</td>
        <td class="p-3 font-black text-white uppercase">${act.nombre}</td>
        <td class="p-3 text-slate-300 max-w-xs truncate">${act.descripcion}</td>
        <td class="p-3 text-right">
          <button onclick="eliminarActividad('${act.id}')" class="text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-950/40 rounded border border-red-800/50">Eliminar</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  contenedor.innerHTML = html;
}

async function renderizarTablaBitacora() {
  const contenedor = document.getElementById('contenedorTablaBitacora');
  if (!contenedor) return;

  const bitacora = await obtenerBitacora();

  if (bitacora.length === 0) {
    contenedor.innerHTML = '<p class="text-xs text-slate-500 py-4 text-center">No hay eventos archivados en la bitácora aún.</p>';
    return;
  }

  let html = `
    <table class="w-full text-left text-xs text-slate-300">
      <thead class="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
        <tr>
          <th class="p-3">Folio</th>
          <th class="p-3">Fecha / Hora</th>
          <th class="p-3">Actividad</th>
          <th class="p-3">Novedades Reportadas</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/80">
  `;

  bitacora.forEach(b => {
    html += `
      <tr class="hover:bg-slate-900/40">
        <td class="p-3 font-mono font-bold text-sky-400">${b.folio || 'N/A'}</td>
        <td class="p-3 font-mono text-slate-400">${b.fecha || ''} ${b.horaRegistro || ''}</td>
        <td class="p-3 font-bold text-white">${b.actividad || ''}</td>
        <td class="p-3 text-slate-300">${b.novedades || ''}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  contenedor.innerHTML = html;
}

async function eliminarActividad(id) {
  if (!confirm('¿Deseas eliminar permanentemente esta actividad de la base de datos?')) return;
  await eliminarActividadRemota(id);
  await renderizarTablas();
}

async function exportarExcel() {
  const bitacora = await obtenerBitacora();
  if (bitacora.length === 0) {
    alert('No hay registros en la bitácora para exportar.');
    return;
  }

  let csv = 'Folio,Fecha,Hora_Registro,Actividad,Novedades\n';
  bitacora.forEach(b => {
    csv += `"${b.folio || ''}","${b.fecha || ''}","${b.horaRegistro || ''}","${(b.actividad || '').replace(/"/g, '""')}","${(b.novedades || '').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_Mensual_C4_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', renderizarTablas);