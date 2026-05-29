/**
 * ============================================================
 * AP3X PATIENT SUPPORT & THERAPY SESSION DASHBOARD SYSTEM
 * Top Navigation Bar
 * ============================================================
 */

import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from './components_ui_Icon'
import StatusDot from './components_ui_StatusDot'
import { useAppStore } from './core_storage'
import { useAuth } from './hooks_useAuth'
import { NAV_ITEMS } from './config_routes'
import { ConnectionStatusPill } from './components_ui_ConnectionStatus'

// ─── Breadcrumb ───────────────────────────────────────────────
function Breadcrumb({ pathname }) {
  const item = NAV_ITEMS.find(n =>
    pathname === n.route || pathname.startsWith(n.route + '/')
  )
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">AP3X Therapy</span>
      <Icon name="ChevronRight" size={14} className="text-slate-700" />
      <span className="text-slate-300 font-medium">
        {item?.label || 'Dashboard'}
      </span>
    </div>
  )
}

// ─── System Status Pill ───────────────────────────────────────
function SystemStatusPill({ status }) {
  return (
    <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/60 rounded-full px-3 py-1.5">
      <StatusDot status={status} />
      <span className="text-xs text-slate-400 font-medium">
        {status === 'online' ? 'System Operational' : status === 'degraded' ? 'Degraded' : 'Offline'}
      </span>
    </div>
  )
}

// ─── Live Clock ───────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = React.useState(() => new Date())
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-teal-400 text-sm tabular-nums">
        {time.toLocaleTimeString('en-GB', { hour12: false })}
      </span>
      <span className="text-slate-600 text-2xs tabular-nums">
        {time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    </div>
  )
}

// ─── User Menu ────────────────────────────────────────────────
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'C'

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/40 transition-colors">
        <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
          <span className="text-xs font-bold text-teal-300">{initial}</span>
        </div>
        <span className="text-xs text-slate-300 hidden sm:block">{user?.name || user?.email || 'Clinician'}</span>
        <Icon name="ChevronDown" size={13} className="text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-800/60 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800/40">
              <p className="text-xs font-medium text-white truncate">{user?.name || 'Clinician'}</p>
              <p className="text-2xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors">
              <Icon name="LogOut" size={13} />Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── TopNav Root ──────────────────────────────────────────────
export default function TopNav() {
  const location     = useLocation()
  const navigate     = useNavigate()
  const { user, logout } = useAuth()
  const systemStatus = useAppStore(s => s.systemStatus)
  const openSidebar  = useAppStore(s => s.openSidebar)

  const handleLogout = () => { logout(); navigate('/auth/login') }

  return (
    <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-slate-800/60 bg-[#060d1a]/95 backdrop-blur-sm z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={openSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
          aria-label="Open menu">
          <Icon name="Menu" size={18} />
        </button>
        <Breadcrumb pathname={location.pathname} />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <SystemStatusPill status={systemStatus} />
        <LiveClock />
        <UserMenu user={user} onLogout={handleLogout} />
      </div>
    </header>
  )
}
