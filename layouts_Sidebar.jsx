/**
 * ============================================================
 * AP3X PATIENT SUPPORT & THERAPY SESSION DASHBOARD SYSTEM
 * Clinician Sidebar -- Drawer Navigation
 * ============================================================
 */

import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from './components_ui_Icon'
import StatusDot from './components_ui_StatusDot'
import { useAppStore } from './core_storage'
import { NAV_ITEMS, NAV_GROUPS } from './config_routes'

function AP3XLogo({ onClose }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/60">
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 bg-teal-500/10 border border-teal-500/30 rounded-lg flex items-center justify-center">
            <Icon name="Heart" size={16} className="text-teal-400" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-teal-400 rounded-full shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-white text-sm leading-tight">AP3X Therapy</div>
          <div className="text-slate-500 text-2xs tracking-widest uppercase">Care Coordination</div>
        </div>
      </div>
      <button onClick={onClose} className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors" aria-label="Close menu">
        <Icon name="X" size={16} />
      </button>
    </div>
  )
}

function NavGroupLabel({ label }) {
  if (!label) return null
  return (
    <div className="px-3 pt-4 pb-1">
      <span className="text-2xs font-semibold tracking-widest uppercase text-slate-600">{label}</span>
    </div>
  )
}

function NavItem({ item, active, onClick }) {
  return (
    <button onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer group relative',
        active ? 'text-white bg-slate-800/80' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
      )}>
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal-400 rounded-r shadow-[0_0_8px_rgba(45,212,191,0.8)]" />}
      <Icon name={item.icon} size={16} className={clsx('flex-shrink-0 transition-colors', active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300')} />
      <span className="truncate">{item.label}</span>
      {item.highlight && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)] flex-shrink-0" />}
    </button>
  )
}

function SidebarFooter() {
  return (
    <div className="px-3 py-3 border-t border-slate-800/60 space-y-2">
      <div className="flex items-center gap-2">
        <StatusDot status="online" />
        <span className="text-xs text-slate-500">System Operational</span>
        <span className="ml-auto text-2xs text-slate-700 font-mono">v2.0.0</span>
      </div>
      <p className="text-2xs text-slate-700 leading-relaxed">
        Simulation &amp; reflection tool only. Not a clinical system.
      </p>
    </div>
  )
}

export default function Sidebar() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const isOpen    = useAppStore(s => s.sidebarExpanded)
  const close     = useAppStore(s => s.closeSidebar)

  const groupOrder = Object.entries(NAV_GROUPS).sort(([, a], [, b]) => a.order - b.order).map(([k]) => k)
  const grouped = groupOrder.reduce((acc, group) => {
    const items = NAV_ITEMS.filter(i => i.group === group)
    if (items.length) acc[group] = items
    return acc
  }, {})

  const handleNav = (route) => { navigate(route); close() }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={close} />}
      <aside className={clsx(
        'fixed top-0 left-0 h-full z-50 flex flex-col bg-[#060d1a] border-r border-slate-800/60 w-72 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <AP3XLogo onClose={close} />
        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-2 py-2">
          {groupOrder.map(group => {
            const items = grouped[group]
            if (!items) return null
            return (
              <div key={group}>
                <NavGroupLabel label={NAV_GROUPS[group].label} />
                <div className="space-y-0.5">
                  {items.map(item => (
                    <NavItem key={item.id} item={item} active={location.pathname.startsWith(item.route) && item.route !== '/'} onClick={() => handleNav(item.route)} />
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
        <SidebarFooter />
      </aside>
    </>
  )
}
