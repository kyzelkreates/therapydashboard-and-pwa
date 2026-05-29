/**
 * ============================================================
 * AP3X PATIENT SUPPORT & THERAPY SESSION DASHBOARD SYSTEM
 * Route Registry
 * ============================================================
 */

export const ROUTES = {
  // ── Core ──────────────────────────────────────────────────
  ROOT:       '/',
  DASHBOARD:  '/dashboard',

  // ── Patient Management ────────────────────────────────────
  PATIENTS:         '/patients',
  PATIENT_PROFILE:  '/patients/:patientId',

  // ── Sessions ──────────────────────────────────────────────
  SESSIONS:         '/sessions',
  SESSION_DETAIL:   '/sessions/:sessionId',

  // ── Reflections & Notes ───────────────────────────────────
  REFLECTIONS: '/reflections',

  // ── Wellbeing Tracker ─────────────────────────────────────
  WELLBEING: '/wellbeing',

  // ── AI Support Assistant ──────────────────────────────────
  AI_ASSISTANT: '/ai-assistant',

  // ── Analytics ─────────────────────────────────────────────
  ANALYTICS: '/analytics',

  // ── Messaging ─────────────────────────────────────────────
  MESSAGING: '/messaging',

  // ── Settings ──────────────────────────────────────────────
  SETTINGS:               '/settings',
  SETTINGS_PROFILE:       '/settings/profile',
  SETTINGS_AI:            '/settings/ai',
  SETTINGS_SECURITY:      '/settings/security',
  SETTINGS_INTEGRATIONS:  '/settings/integrations',

  // ── Patient PWA (standalone, no auth guard) ───────────────
  PATIENT_APP:  '/patient-app',
  PATIENT_LOGIN: '/patient-login',

  // ── Demo Hub (standalone) ─────────────────────────────────
  DEMO: '/demo',

  // ── Auth ──────────────────────────────────────────────────
  AUTH_LOGIN:   '/auth/login',
  AUTH_LOGOUT:  '/auth/logout',
  AUTH_SETUP:   '/auth/setup',

  // ── Error ─────────────────────────────────────────────────
  NOT_FOUND: '*'
}

// ─── Sidebar Nav Structure ────────────────────────────────────
export const NAV_ITEMS = [
  {
    id:    'dashboard',
    label: 'Overview',
    route: ROUTES.DASHBOARD,
    icon:  'LayoutDashboard',
    group: 'core'
  },
  {
    id:    'patients',
    label: 'Patients',
    route: ROUTES.PATIENTS,
    icon:  'Users',
    group: 'care'
  },
  {
    id:    'sessions',
    label: 'Sessions',
    route: ROUTES.SESSIONS,
    icon:  'CalendarCheck',
    group: 'care'
  },
  {
    id:    'reflections',
    label: 'Reflections & Notes',
    route: ROUTES.REFLECTIONS,
    icon:  'BookOpen',
    group: 'care'
  },
  {
    id:    'wellbeing',
    label: 'Wellbeing Tracker',
    route: ROUTES.WELLBEING,
    icon:  'Heart',
    group: 'care'
  },
  {
    id:        'ai-assistant',
    label:     'Support Assistant',
    route:     ROUTES.AI_ASSISTANT,
    icon:      'Sparkles',
    group:     'intelligence',
    highlight: true,
  },
  {
    id:    'analytics',
    label: 'Progress Analytics',
    route: ROUTES.ANALYTICS,
    icon:  'BarChart3',
    group: 'intelligence'
  },
  {
    id:    'messaging',
    label: 'Messaging',
    route: ROUTES.MESSAGING,
    icon:  'MessageSquare',
    group: 'reporting'
  },
  {
    id:    'settings',
    label: 'Settings',
    route: ROUTES.SETTINGS,
    icon:  'Settings',
    group: 'system'
  }
]

export const NAV_GROUPS = {
  core:         { label: null,             order: 0 },
  care:         { label: 'Care & Sessions', order: 1 },
  intelligence: { label: 'Intelligence',   order: 2 },
  reporting:    { label: 'Reporting',      order: 3 },
  system:       { label: 'System',         order: 4 }
}

export default ROUTES
