
let alertasDescartadas = new Set();
let ultimaMarcaRepique = 0;
let actividadesEnVivoPrevias = new Set();

function normalizarTexto(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function obtenerNombreDiaActual() {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  return dias[new Date().getDay()];
}

function convertirAHoraMinutos(horaString) {
  const [h, m] = horaString.split(':').map(Number);
  return h * 60 + m;
}

function actualizarReloj() {
  const ahora = new Date();
  const elementoReloj = document.getElementById('relojDigital');
  if (elementoReloj) {
    elementoReloj.textContent = ahora.toLocaleTimeString('es-MX', { hour12: false });
  }
}

function evaluarOperativosYAlertas() {
  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  const diaHoyNorm = normalizarTexto(obtenerNombreDiaActual());
  
  const actividadesHoy = obtenerActividades().filter(act => 
    normalizarTexto(act.dia) === diaHoyNorm
  );

  const actividadesEnVivo = [];

  actividadesHoy.forEach(act => {
    const inicio = convertirAHoraMinutos(act.inicio);
    const fin = convertirAHoraMinutos(act.fin);

    const enCurso = fin > inicio 
      ? (minutosActuales >= inicio && minutosActuales < fin)
      : (minutosActuales >= inicio || minutosActuales < fin);

    if (enCurso) {
      actividadesEnVivo.push(act);
    }
  });

  renderizarTarjetasDia(actividadesHoy, actividadesEnVivo);
  gestionarModalAlertas(actividadesEnVivo);
}

function renderizarTarjetasDia(actividades, actividadesEnVivo) {
  const contenedor = document.getElementById('gridActividades');
  const contadorTotal = document.getElementById('contadorTotalHoy');
  const contadorEnVivo = document.getElementById('contadorEnVivoHoy');

  if (contadorTotal) contadorTotal.textContent = `ACTIVIDADES HOY: ${actividades.length}`;
  if (contadorEnVivo) contadorEnVivo.textContent = `EN CURSO: ${actividadesEnVivo.length}`;

  if (!contenedor) return;
  contenedor.innerHTML = '';

  if (actividades.length === 0) {
    contenedor.innerHTML = '<div class="col-span-full text-center text-slate-500 py-16 font-medium">No hay actividades programadas para este turno.</div>';
    return;
  }

  actividades.forEach(act => {
    const estaEnVivo = actividadesEnVivo.some(v => v.id === act.id);
    const div = document.createElement('div');
    div.className = `panel-institucional rounded-xl p-5 border transition-all ${
      estaEnVivo ? 'tarjeta-en-vivo-alerta' : 'border-slate-800/80 border-l-[6px] border-l-slate-600'
    }`;

    div.innerHTML = `
      <div class="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
        <span class="text-xs font-mono font-bold tracking-wider text-slate-400">🕒 ${act.inicio} - ${act.fin} HRS</span>
        <span class="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
          estaEnVivo ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
        }">
          ${estaEnVivo ? '🔴 EN VIVO' : 'PROGRAMADO'}
        </span>
      </div>
      <h3 class="text-xl font-black text-white uppercase tracking-wide mb-2 drop-shadow-sm">${act.nombre}</h3>
      <div class="bg-slate-900/60 rounded-lg p-3 border border-slate-800/70 mb-4">
        <span class="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">Descripción de la actividad:</span>
        <p class="text-xs text-slate-300 leading-relaxed font-medium">${act.descripcion}</p>
      </div>
      <button onclick="archivarDesdeMonitor('${act.id}')" class="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 font-bold transition-all">
        🗄️ Archivar en Bitácora
      </button>
    `;
    contenedor.appendChild(div);
  });
}

function gestionarModalAlertas(actividadesEnVivo) {
  const modal = document.getElementById('modalAlertas');
  const lista = document.getElementById('listaAlertasEmergentes');
  const pastilla = document.getElementById('pastillaReabrir');
  const conteoPastilla = document.getElementById('conteoPastillaAlertas');

  // Detección de arranque para sonar los primeros 5 segundos
  const hayNuevaAlerta = actividadesEnVivo.some(act => !actividadesEnVivoPrevias.has(act.id));
  if (hayNuevaAlerta && actividadesEnVivo.length > 0) {
    motorAudio.sonarSirenaTactico(5);
    ultimaMarcaRepique = Date.now();
  }
  actividadesEnVivoPrevias = new Set(actividadesEnVivo.map(a => a.id));

  const alertasVisibles = actividadesEnVivo.filter(act => !alertasDescartadas.has(act.id));

  if (alertasVisibles.length > 0) {
    modal.classList.remove('hidden');
    pastilla.classList.add('hidden');

    lista.innerHTML = '';
    alertasVisibles.forEach(act => {
      const item = document.createElement('div');
      item.className = 'bg-slate-900 border-2 border-red-500/80 rounded-xl p-5 relative shadow-2xl';
      item.innerHTML = `
        <button onclick="descartarAlertaIndividual('${act.id}')" class="absolute top-3 right-3 text-slate-400 hover:text-white text-lg font-black p-1">✕</button>
        <div class="flex items-center gap-2 mb-2">
          <span class="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded tracking-wider">ACTIVIDAD EN CURSO</span>
          <span class="text-xs font-mono text-slate-400 font-bold">${act.inicio} - ${act.fin} HRS</span>
        </div>
        <h4 class="text-xl font-black text-white uppercase tracking-wide mb-2">${act.nombre}</h4>
        <div class="bg-slate-950/80 rounded-lg p-3 border border-slate-800 mb-3">
          <span class="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">Descripción:</span>
          <p class="text-xs text-slate-300 font-medium">${act.descripcion}</p>
        </div>
        <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
          <span>🔊 Sirena: 5s al iniciar</span>
          <span class="text-amber-400 font-bold">Repique cada 5m</span>
        </div>
      `;
      lista.appendChild(item);
    });

    // Repique automático cada 5 minutos (300,000 ms)
    const ahora = Date.now();
    if (ahora - ultimaMarcaRepique >= 300000) {
      motorAudio.sonarSirenaTactico(5);
      ultimaMarcaRepique = ahora;
    }
  } else {
    modal.classList.add('hidden');
    if (actividadesEnVivo.length > 0) {
      pastilla.classList.remove('hidden');
      if (conteoPastilla) conteoPastilla.textContent = `${actividadesEnVivo.length} Alerta(s) en curso`;
    } else {
      pastilla.classList.add('hidden');
      alertasDescartadas.clear();
    }
  }
}

function descartarAlertaIndividual(id) {
  alertasDescartadas.add(id);
  evaluarOperativosYAlertas();
}

function cerrarTodasAlertas() {
  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  const diaHoyNorm = normalizarTexto(obtenerNombreDiaActual());
  
  obtenerActividades().forEach(act => {
    if (normalizarTexto(act.dia) === diaHoyNorm) {
      const inicio = convertirAHoraMinutos(act.inicio);
      const fin = convertirAHoraMinutos(act.fin);
      const enCurso = fin > inicio ? (minutosActuales >= inicio && minutosActuales < fin) : (minutosActuales >= inicio || minutosActuales < fin);
      if (enCurso) alertasDescartadas.add(act.id);
    }
  });
  evaluarOperativosYAlertas();
}

function reabrirModalAlertas() {
  alertasDescartadas.clear();
  evaluarOperativosYAlertas();
}

function archivarDesdeMonitor(id) {
  const actividades = obtenerActividades();
  const act = actividades.find(a => a.id === id);
  if (!act) return;

  const novedades = prompt(`Ingresa novedades para archivar "${act.nombre}":`, 'Operativo concluido sin novedad.');
  if (novedades === null) return;

  registrarEnBitacora({
    actividad: act.nombre,
    dia: act.dia,
    horario: `${act.inicio} - ${act.fin}`,
    novedades: novedades || 'Sin novedad reportada.'
  });

  alert('Actividad archivada exitosamente en la bitácora.');
}

// Inicialización
setInterval(actualizarReloj, 1000);
setInterval(evaluarOperativosYAlertas, 4000);
document.addEventListener('DOMContentLoaded', () => {
  actualizarReloj();
  evaluarOperativosYAlertas();
});
