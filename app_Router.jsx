/**
 * ============================================================
 * AP3X PATIENT SUPPORT & THERAPY SESSION DASHBOARD SYSTEM
 * Application Router
 * ============================================================
 */

import { createHashRouter, Navigate } from 'react-router-dom'
import AppShell     from './layouts_AppShell'
import AuthGuard    from './components_auth_AuthGuard'

// Auth
import Login        from './pages_auth_Login'
import ResetConfirm from './pages_auth_ResetConfirm'
import Setup        from './pages_auth_Setup'

// Clinician Dashboard Pages
import Dashboard    from './pages_Dashboard'
import Patients     from './pages_Patients'
import Sessions     from './pages_Sessions'
import Reflections  from './pages_Reflections'
import Wellbeing    from './pages_Wellbeing'
import AIAssistant  from './pages_AIAssistant'
import Analytics    from './pages_Analytics'
import Messaging    from './pages_Messaging'
import Settings     from './pages_Settings'
import NotFound     from './pages_NotFound'

// Standalone (no auth)
import PatientApp   from './pages_PatientApp'
import DemoHub      from './pages_DemoHub'

const setupDone = () => localStorage.getItem('apex:setup_complete') === 'true'

const RootRedirect = () =>
  setupDone() ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/setup" replace />

const LoginOrSetup = ({ element }) =>
  !setupDone() ? <Navigate to="/auth/setup" replace /> : element

export const router = createHashRouter([
  // First-run Setup
  { path: '/auth/setup', element: <Setup /> },

  // Auth
  { path: '/auth/login',         element: <LoginOrSetup element={<Login />} /> },
  { path: '/auth/reset-confirm', element: <ResetConfirm /> },

  // Standalone -- no auth required
  { path: '/patient-app',  element: <PatientApp /> },
  { path: '/demo',         element: <DemoHub /> },

  // Protected Clinician Dashboard
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <RootRedirect /> },
      { path: 'dashboard',              element: <Dashboard /> },
      { path: 'patients',               element: <Patients /> },
      { path: 'patients/:patientId',    element: <Patients /> },
      { path: 'sessions',               element: <Sessions /> },
      { path: 'sessions/:sessionId',    element: <Sessions /> },
      { path: 'reflections',            element: <Reflections /> },
      { path: 'wellbeing',              element: <Wellbeing /> },
      { path: 'ai-assistant',           element: <AIAssistant /> },
      { path: 'analytics',              element: <Analytics /> },
      { path: 'messaging',              element: <Messaging /> },
      { path: 'settings',               element: <Settings /> },
      { path: 'settings/:section',      element: <Settings /> },
    ]
  },
  { path: '*', element: <NotFound /> }
])

export default router
