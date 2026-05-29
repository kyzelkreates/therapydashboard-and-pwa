/**
 * ============================================================
 * AP3X Patient ↔ Therapist Sync Service
 *
 * The patient PWA writes check-ins, reflections, and session
 * data to localStorage under shared keys. This service:
 *   1. Provides a cross-tab BroadcastChannel so the therapist
 *      dashboard updates in real-time when a patient submits.
 *   2. Exposes a unified read API for the dashboard.
 *   3. Handles Supabase sync when a backend is configured.
 *
 * Architecture:
 *   Patient PWA  →  localStorage  →  BroadcastChannel  →  Clinician Dashboard
 *                                ↘  Supabase (optional, via backendService)
 * ============================================================
 */

const CHANNEL_NAME = 'ap3x:patient-sync'
const KEYS = {
  CHECKINS:    'ap3x:checkins',
  REFLECTIONS: 'ap3x:reflections',
  SESSIONS:    'ap3x:sessions',
  PATIENTS:    'ap3x:patients',
  ALERTS:      'ap3x:risk:alerts',
}

// ─── Storage helpers ──────────────────────────────────────────
const store = {
  get:    (key, def = []) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? def } catch { return def } },
  set:    (key, val)       => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} },
  append: (key, item, max = 500) => {
    const arr = store.get(key, [])
    const next = [item, ...arr.filter(r => r.id !== item.id)].slice(0, max)
    store.set(key, next)
    return next
  },
}

// ─── BroadcastChannel (cross-tab real-time) ───────────────────
let _channel = null
const _listeners = new Set()

function getChannel() {
  if (!_channel && typeof BroadcastChannel !== 'undefined') {
    _channel = new BroadcastChannel(CHANNEL_NAME)
    _channel.onmessage = (ev) => {
      _listeners.forEach(fn => fn(ev.data))
    }
  }
  return _channel
}

// ─── Main service ─────────────────────────────────────────────
export const patientSync = {

  // ── Subscribe to real-time updates ───────────────────────
  onUpdate(cb) {
    _listeners.add(cb)
    getChannel() // ensure channel is open
    return () => _listeners.delete(cb)
  },

  // ── Broadcast to other tabs ───────────────────────────────
  broadcast(type, payload) {
    try { getChannel()?.postMessage({ type, payload, ts: Date.now() }) } catch {}
  },

  // ────────────────────────────────────────────────────────────
  // PATIENT PWA WRITES (called from PatientApp)
  // ────────────────────────────────────────────────────────────

  submitCheckin(checkin) {
    const full = { ...checkin, syncedAt: new Date().toISOString() }
    store.append(KEYS.CHECKINS, full)
    this.broadcast('checkin', full)
    return full
  },

  submitReflection(reflection) {
    const full = { ...reflection, syncedAt: new Date().toISOString() }
    store.append(KEYS.REFLECTIONS, full)
    this.broadcast('reflection', full)
    return full
  },

  submitSession(session) {
    const sessions = store.get(KEYS.SESSIONS, [])
    const existing = sessions.findIndex(s => s.id === session.id)
    let next
    if (existing >= 0) {
      next = sessions.map(s => s.id === session.id ? { ...s, ...session } : s)
    } else {
      next = [session, ...sessions]
    }
    store.set(KEYS.SESSIONS, next.slice(0, 500))
    this.broadcast('session', session)
    return session
  },

  // ────────────────────────────────────────────────────────────
  // CLINICIAN DASHBOARD READS
  // ────────────────────────────────────────────────────────────

  getAllCheckins()    { return store.get(KEYS.CHECKINS, []) },
  getAllReflections() { return store.get(KEYS.REFLECTIONS, []) },
  getAllSessions()    { return store.get(KEYS.SESSIONS, []) },
  getAllPatients()    { return store.get(KEYS.PATIENTS, []) },

  getPatientCheckins(patientId) {
    return this.getAllCheckins()
      .filter(c => c.patientId === patientId)
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
  },

  getPatientReflections(patientId) {
    return this.getAllReflections()
      .filter(r => r.patientId === patientId)
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
  },

  getPatientSessions(patientId) {
    return this.getAllSessions()
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
  },

  // ── Risk alerts storage ───────────────────────────────────
  saveAlert(alert) {
    store.append(KEYS.ALERTS, { id: `alert_${Date.now()}`, ...alert }, 100)
    this.broadcast('risk_alert', alert)
  },

  getAlerts() {
    return store.get(KEYS.ALERTS, [])
  },

  dismissAlert(alertId) {
    const alerts = store.get(KEYS.ALERTS, []).map(a =>
      a.id === alertId ? { ...a, dismissed: true, dismissedAt: new Date().toISOString() } : a
    )
    store.set(KEYS.ALERTS, alerts)
  },

  // ── Seed demo patient data ────────────────────────────────
  seedDemoData(patients) {
    const now = Date.now()
    const checkins = []
    const reflections = []
    const sessions = []

    patients.forEach(patient => {
      // Generate 8 weeks of check-ins, roughly 2x/week
      for (let i = 0; i < 16; i++) {
        const daysAgo = i * 3.5 + Math.random() * 2
        const ts = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        const moodScore = Math.max(1, Math.min(10, patient.state === 'improved'
          ? 4 + Math.random() * 4 + (16 - i) * 0.15
          : patient.state === 'stressed'
            ? 2 + Math.random() * 3
            : 3 + Math.random() * 5))
        const moods = ['great','good','okay','low','anxious','tired','hopeful','overwhelmed','calm']
        const mood = moodScore > 7 ? 'good' : moodScore > 5 ? 'okay' : moodScore > 3 ? 'low' : 'anxious'

        checkins.push({
          id:          `chk_${patient.id}_${i}`,
          patientId:   patient.id,
          patientName: patient.name,
          ts,
          mood,
          moodScore:    Math.round(moodScore),
          energyScore:  Math.max(1, Math.min(10, moodScore + (Math.random() * 2 - 1))),
          notes:        '',
        })
      }

      // 8 sessions
      for (let i = 0; i < 8; i++) {
        const daysAgo = i * 7 + 1
        const startedAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        const completedAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
        sessions.push({
          id:          `sess_${patient.id}_${i}`,
          patientId:   patient.id,
          patientName: patient.name,
          phase:       'complete',
          state:       patient.state,
          startedAt,
          completedAt,
          moodScore:    checkins.find(c => c.patientId === patient.id)?.moodScore || 5,
          energyScore:  5,
          summary:      `Session with ${patient.name} completed.`,
          aiPrompts:    [],
          events:       [],
        })
      }
    })

    store.set(KEYS.CHECKINS, checkins)
    store.set(KEYS.REFLECTIONS, reflections)
    store.set(KEYS.SESSIONS, sessions)
    store.set(KEYS.PATIENTS, patients)

    this.broadcast('demo_seeded', { patientCount: patients.length })
    return { checkins: checkins.length, sessions: sessions.length }
  },

  clearAll() {
    [KEYS.CHECKINS, KEYS.REFLECTIONS, KEYS.SESSIONS, KEYS.ALERTS].forEach(k => localStorage.removeItem(k))
    this.broadcast('cleared', {})
  },
}

export default patientSync
