/**
 * storage.js - Capa de sincronización en tiempo real con Firebase Realtime Database
 */
// URL EXACTA DE TU BASE DE DATOS FIREBASE:
const URL_FIREBASE = "https://c4-monitoreo-8d236-default-rtdb.firebaseio.com";

// Obtener todas las actividades registradas en la nube
async function obtenerActividades() {
  try {
    const respuesta = await fetch(`${URL_FIREBASE}/actividades.json`);
    const datos = await respuesta.json();
    if (!datos) return [];
    return Object.keys(datos).map(key => ({ id: key, ...datos[key] }));
  } catch (error) {
    console.error("Error al obtener actividades de Firebase:", error);
    return [];
  }
}

// Guardar nueva actividad en la base de datos remota
async function guardarActividadRemota(actividad) {
  try {
    const respuesta = await fetch(`${URL_FIREBASE}/actividades.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actividad)
    });
    return await respuesta.json();
  } catch (error) {
    console.error("Error al guardar actividad en Firebase:", error);
  }
}

// Eliminar actividad en la base de datos remota
async function eliminarActividadRemota(id) {
  try {
    await fetch(`${URL_FIREBASE}/actividades/${id}.json`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error("Error al eliminar actividad en Firebase:", error);
  }
}

// Registrar evento en la bitácora remota
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
    console.error("Error al registrar en bitácora de Firebase:", error);
  }
}

// Obtener registros de la bitácora
async function obtenerBitacora() {
  try {
    const respuesta = await fetch(`${URL_FIREBASE}/bitacora.json`);
    const datos = await respuesta.json();
    if (!datos) return [];
    return Object.keys(datos).map(key => ({ idFirebase: key, ...datos[key] }));
  } catch (error) {
    console.error("Error al leer bitácora de Firebase:", error);
    return [];
  }
}