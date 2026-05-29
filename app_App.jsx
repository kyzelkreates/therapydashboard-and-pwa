/**
 * ============================================================
 * AP3X PATIENT SUPPORT & THERAPY SESSION DASHBOARD SYSTEM
 * Root App Component
 * ============================================================
 */

import { RouterProvider } from 'react-router-dom'
import { router } from './app_Router'
import AuthProvider from './providers_AuthProvider'
import { useSystemStatus } from './hooks_useSystemStatus'
import { useEffect } from 'react'

function AppCore() {
  useSystemStatus()
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppCore />
    </AuthProvider>
  )
}
