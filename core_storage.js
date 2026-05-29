/**
 * ============================================================
 * AP3X PATIENT SUPPORT & THERAPY SESSION DASHBOARD SYSTEM
 * Core Storage -- Single Source of Truth
 * Shared state across: Clinician Dashboard · Patient PWA · Demo Hub
 * ============================================================
 */

import { create } from 'zustand'

// ─── Storage Keys ─────────────────────────────────────────────
export const STORAGE_KEYS = {
  // App
  APP_THEME:           'ap3x:app:theme',
  APP_SIDEBAR:         'ap3x:app:sidebar',
  APP_DEMO_MODE:       'ap3x:app:demo_mode',

  // Auth
  AUTH_SESSION:        'ap3x:auth:session',
  AUTH_USER:           'ap3x:auth:user',
  AUTH_ROLE:           'ap3x:auth:role',

  // Sessions
  SESSIONS:            'ap3x:sessions',
  ACTIVE_SESSION:      'ap3x:sessions:active',

  // Check-ins
  CHECKINS:            'ap3x:checkins',

  // Reflections
  REFLECTIONS:         'ap3x:reflections',

  // AI Messages
  AI_MESSAGES:         'ap3x:ai:messages',
  AI_PROVIDER:         'ap3x:ai:provider',
  AI_CONFIG:           'ap3x:ai:config',

  // Patient State
  PATIENT_STATE:       'ap3x:patient:state',
  PATIENT_PROFILE:     'ap3x:patient:profile',

  // Simulation
  SIM_RUNNING:         'ap3x:sim:running',
  SIM_EVENTS:          'ap3x:sim:events',

  // Navigation
  NOTIF_QUEUE:         'ap3x:notif:queue',
}

// ─── Persist Helpers ──────────────────────────────────────────
const persist = {
  get: (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : fallback
    } catch { return fallback }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)) }
    catch (e) { console.warn('[AP3X:Storage] persist.set failed:', key, e) }
  },
  remove: (key) => { try { localStorage.removeItem(key) } catch {} },
  clear: (prefix = 'ap3x:') => {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k))
    } catch {}
  }
}

// ─── App Store ────────────────────────────────────────────────
export const useAppStore = create((set, get) => ({
  theme:           persist.get(STORAGE_KEYS.APP_THEME, 'dark'),
  sidebarExpanded: false,
  demoMode:        persist.get(STORAGE_KEYS.APP_DEMO_MODE, false),
  systemStatus:    'online',
  notifications:   [],
  alerts:          [],

  setTheme: (theme) => { persist.set(STORAGE_KEYS.APP_THEME, theme); set({ theme }) },
  toggleSidebar: () => { const n = !get().sidebarExpanded; set({ sidebarExpanded: n }) },
  closeSidebar: () => set({ sidebarExpanded: false }),
  openSidebar:  () => set({ sidebarExpanded: true }),
  setSystemStatus: (s) => set({ systemStatus: s }),
  toggleDemoMode: () => {
    const next = !get().demoMode
    persist.set(STORAGE_KEYS.APP_DEMO_MODE, next)
    set({ demoMode: next })
  },
  addNotification: (notif) => set(s => ({
    notifications: [{ id: Date.now(), ts: new Date().toISOString(), ...notif }, ...s.notifications].slice(0, 50)
  })),
  clearNotifications: () => set({ notifications: [] }),
  addAlert: (alert) => set(s => ({
    alerts: [{ id: Date.now(), ts: new Date().toISOString(), ...alert }, ...s.alerts].slice(0, 50)
  })),
}))

// ─── Auth Store ───────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  session:   persist.get(STORAGE_KEYS.AUTH_SESSION, null),
  user:      persist.get(STORAGE_KEYS.AUTH_USER, null),
  role:      persist.get(STORAGE_KEYS.AUTH_ROLE, 'clinician'),
  isLoading: false,

  setSession: (session) => { persist.set(STORAGE_KEYS.AUTH_SESSION, session); set({ session }) },
  setUser:    (user)    => { persist.set(STORAGE_KEYS.AUTH_USER, user);       set({ user }) },
  setRole:    (role)    => { persist.set(STORAGE_KEYS.AUTH_ROLE, role);       set({ role }) },
  setLoading: (v)       => set({ isLoading: v }),
  logout: () => {
    persist.remove(STORAGE_KEYS.AUTH_SESSION)
    persist.remove(STORAGE_KEYS.AUTH_USER)
    set({ session: null, user: null })
  },
}))

// ─── Session Store (Therapy Sessions) ────────────────────────
export const useSessionStore = create((set, get) => ({
  sessions:      persist.get(STORAGE_KEYS.SESSIONS, []),
  activeSession: persist.get(STORAGE_KEYS.ACTIVE_SESSION, null),

  setSessions: (sessions) => { persist.set(STORAGE_KEYS.SESSIONS, sessions); set({ sessions }) },
  addSession:  (session)  => {
    const sessions = [session, ...get().sessions]
    persist.set(STORAGE_KEYS.SESSIONS, sessions)
    set({ sessions })
  },
  updateSession: (id, patch) => {
    const sessions = get().sessions.map(s => s.id === id ? { ...s, ...patch } : s)
    persist.set(STORAGE_KEYS.SESSIONS, sessions)
    set({ sessions })
  },
  removeSession: (id) => {
    const sessions = get().sessions.filter(s => s.id !== id)
    persist.set(STORAGE_KEYS.SESSIONS, sessions)
    set({ sessions })
  },
  setActiveSession: (session) => {
    persist.set(STORAGE_KEYS.ACTIVE_SESSION, session)
    set({ activeSession: session })
  },
  clearActiveSession: () => {
    persist.remove(STORAGE_KEYS.ACTIVE_SESSION)
    set({ activeSession: null })
  },
}))

// ─── Check-in Store ───────────────────────────────────────────
export const useCheckinStore = create((set, get) => ({
  checkins: persist.get(STORAGE_KEYS.CHECKINS, []),

  addCheckin: (checkin) => {
    const checkins = [checkin, ...get().checkins]
    persist.set(STORAGE_KEYS.CHECKINS, checkins)
    set({ checkins })
  },
  getLatestCheckin: () => get().checkins[0] || null,
}))

// ─── Reflection Store ─────────────────────────────────────────
export const useReflectionStore = create((set, get) => ({
  reflections: persist.get(STORAGE_KEYS.REFLECTIONS, []),

  addReflection: (reflection) => {
    const reflections = [reflection, ...get().reflections]
    persist.set(STORAGE_KEYS.REFLECTIONS, reflections)
    set({ reflections })
  },
  updateReflection: (id, patch) => {
    const reflections = get().reflections.map(r => r.id === id ? { ...r, ...patch } : r)
    persist.set(STORAGE_KEYS.REFLECTIONS, reflections)
    set({ reflections })
  },
}))

// ─── AI Store ─────────────────────────────────────────────────
export const useAIStore = create((set, get) => ({
  messages:   persist.get(STORAGE_KEYS.AI_MESSAGES, []),
  provider:   persist.get(STORAGE_KEYS.AI_PROVIDER, null),
  tokenUsage: 0,
  isTyping:   false,

  addMessage: (msg) => {
    const messages = [...get().messages, { id: Date.now(), ts: new Date().toISOString(), ...msg }]
    persist.set(STORAGE_KEYS.AI_MESSAGES, messages.slice(-200))
    set({ messages: messages.slice(-200) })
  },
  clearMessages: () => { persist.remove(STORAGE_KEYS.AI_MESSAGES); set({ messages: [] }) },
  setProvider: (p) => { persist.set(STORAGE_KEYS.AI_PROVIDER, p); set({ provider: p }) },
  setTyping: (v) => set({ isTyping: v }),
  addTokens: (n) => set(s => ({ tokenUsage: s.tokenUsage + n })),
}))

// ─── Patient State Store ──────────────────────────────────────
export const usePatientStore = create((set, get) => ({
  patients:     persist.get('ap3x:patients', []),
  patientState: persist.get(STORAGE_KEYS.PATIENT_STATE, {}),  // { [patientId]: state }
  profile:      persist.get(STORAGE_KEYS.PATIENT_PROFILE, null), // logged-in patient

  setPatients: (patients) => { persist.set('ap3x:patients', patients); set({ patients }) },
  addPatient: (patient) => {
    const patients = [patient, ...get().patients]
    persist.set('ap3x:patients', patients)
    set({ patients })
  },
  updatePatient: (id, patch) => {
    const patients = get().patients.map(p => p.id === id ? { ...p, ...patch } : p)
    persist.set('ap3x:patients', patients)
    set({ patients })
  },
  setPatientState: (patientId, state) => {
    const s = { ...get().patientState, [patientId]: state }
    persist.set(STORAGE_KEYS.PATIENT_STATE, s)
    set({ patientState: s })
  },
  setProfile: (profile) => { persist.set(STORAGE_KEYS.PATIENT_PROFILE, profile); set({ profile }) },
}))

// ─── Simulation Store ─────────────────────────────────────────
export const useSimulationStore = create((set, get) => ({
  running:    persist.get(STORAGE_KEYS.SIM_RUNNING, false),
  events:     persist.get(STORAGE_KEYS.SIM_EVENTS, []),
  sessionLog: [],

  setRunning: (v) => { persist.set(STORAGE_KEYS.SIM_RUNNING, v); set({ running: v }) },
  addEvent: (event) => {
    const events = [{ id: Date.now(), ts: new Date().toISOString(), ...event }, ...get().events].slice(0, 500)
    persist.set(STORAGE_KEYS.SIM_EVENTS, events)
    set({ events })
  },
  clearEvents: () => { persist.remove(STORAGE_KEYS.SIM_EVENTS); set({ events: [], sessionLog: [] }) },
  addSessionLog: (entry) => set(s => ({
    sessionLog: [{ id: Date.now(), ts: new Date().toISOString(), ...entry }, ...s.sessionLog].slice(0, 100)
  })),
}))

export { persist }
export default { useAppStore, useAuthStore, useSessionStore, useCheckinStore, useReflectionStore, useAIStore, usePatientStore, useSimulationStore }
