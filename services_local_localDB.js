/**
 * AP3X Therapy - Local DB stub
 * Minimal compatibility shim - therapy system uses Zustand/localStorage directly
 */

export const DB_KEYS = {
  SESSIONS:    'ap3x:sessions',
  CHECKINS:    'ap3x:checkins',
  REFLECTIONS: 'ap3x:reflections',
  PATIENTS:    'ap3x:patients',
}

const _listeners = {}

function get(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  ;(_listeners[key] || []).forEach(fn => fn(value))
}

export const jobTable = {
  list: () => get(DB_KEYS.SESSIONS) || [],
  get:  (id) => (get(DB_KEYS.SESSIONS) || []).find(r => r.id === id),
  create: (d) => { const rows = get(DB_KEYS.SESSIONS) || []; rows.unshift(d); set(DB_KEYS.SESSIONS, rows); return d },
  update: (id, d) => { const rows = (get(DB_KEYS.SESSIONS) || []).map(r => r.id === id ? { ...r, ...d } : r); set(DB_KEYS.SESSIONS, rows) },
  delete: (id) => set(DB_KEYS.SESSIONS, (get(DB_KEYS.SESSIONS) || []).filter(r => r.id !== id)),
}

export const driverTable = {
  list:   () => get(DB_KEYS.PATIENTS) || [],
  get:    (id) => (get(DB_KEYS.PATIENTS) || []).find(r => r.id === id),
  create: (d) => { const rows = get(DB_KEYS.PATIENTS) || []; rows.unshift(d); set(DB_KEYS.PATIENTS, rows); return d },
  update: (id, d) => { const rows = (get(DB_KEYS.PATIENTS) || []).map(r => r.id === id ? { ...r, ...d } : r); set(DB_KEYS.PATIENTS, rows) },
  delete: (id) => set(DB_KEYS.PATIENTS, (get(DB_KEYS.PATIENTS) || []).filter(r => r.id !== id)),
}

export const vehicleTable = {
  list:   () => [],
  get:    () => null,
  create: (d) => d,
  update: () => {},
  delete: () => {},
}

export function subscribe(key, cb) {
  if (!_listeners[key]) _listeners[key] = []
  _listeners[key].push(cb)
  return () => { _listeners[key] = _listeners[key].filter(fn => fn !== cb) }
}

export default { jobTable, driverTable, vehicleTable, subscribe, DB_KEYS }
