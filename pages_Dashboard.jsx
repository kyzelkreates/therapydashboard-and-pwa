/**
 * ============================================================
 * AP3X -- Therapy Session & Care Coordination Dashboard
 * Main clinician overview with session timeline, patient cards,
 * activity feed, and AI insight panel.
 * ============================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './components_ui_Icon'
import { useSessionStore, usePatientStore, useSimulationStore, useAppStore } from './core_storage'
import sessionSimulation, { PATIENT_STATE_CONFIG, SESSION_PHASES, SESSION_EVENTS } from './engine_sessionSimulation'

// ─── Live Clock ───────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <div className="text-right">
      <div className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight">
        {time.toLocaleTimeString('en-GB', { hour12: false })}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        {time.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, bg, border, onClick }) {
  return (
    <div onClick={onClick} className={`${bg} border ${border} rounded-xl p-4 cursor-pointer hover:brightness-110 transition-all group`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xs text-slate-500 font-semibold tracking-widest uppercase">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
          <Icon name={icon} size={14} className={color} />
        </div>
      </div>
      <div className={`font-mono text-3xl font-bold ${color} tabular-nums`}>{value ?? '--'}</div>
      {sub && <div className="text-2xs text-slate-600 mt-1.5">{sub}</div>}
    </div>
  )
}

// ─── Patient Activity Card ────────────────────────────────────
function PatientCard({ patient, onClick }) {
  const cfg = PATIENT_STATE_CONFIG[patient.state] || PATIENT_STATE_CONFIG.neutral
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/30 border border-slate-800/60 hover:bg-slate-800/50 cursor-pointer transition-all group">
      <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-teal-400">{patient.initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white group-hover:text-teal-200 transition-colors truncate">{patient.name}</div>
        <div className="text-2xs text-slate-500">Last session: {patient.lastSession}</div>
      </div>
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-medium ${cfg.bg} ${cfg.border} border ${cfg.color}`}>
        <Icon name={cfg.icon} size={10} />
        {cfg.label}
      </div>
    </div>
  )
}

// ─── Session Timeline Row ─────────────────────────────────────
function SessionTimelineRow({ session }) {
  const isComplete = session.phase === SESSION_PHASES.COMPLETE
  const cfg = PATIENT_STATE_CONFIG[session.state] || PATIENT_STATE_CONFIG.neutral
  return (
    <div className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-slate-800/30 transition-colors">
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isComplete ? 'bg-teal-400' : 'bg-amber-400 animate-pulse'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{session.patientName}</span>
          <span className={`text-2xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
        </div>
        <div className="text-2xs text-slate-500 mt-0.5">
          {session.phase === SESSION_PHASES.COMPLETE ? 'Session complete' : `In progress -- ${session.phase?.replace('_', ' ')}`}
          {' · '}{new Date(session.startedAt).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {session.moodScore && (
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-mono text-teal-400">{session.moodScore}/10</div>
          <div className="text-2xs text-slate-600">mood</div>
        </div>
      )}
    </div>
  )
}

// ─── AI Insight Panel ─────────────────────────────────────────
function AIInsightPanel({ sessions, patients }) {
  const stateCounts = {}
  patients.forEach(p => { stateCounts[p.state] = (stateCounts[p.state] || 0) + 1 })
  const dominantState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
  const cfg = PATIENT_STATE_CONFIG[dominantState] || PATIENT_STATE_CONFIG.neutral

  const completedToday = sessions.filter(s => {
    const today = new Date().toDateString()
    return s.phase === SESSION_PHASES.COMPLETE && new Date(s.startedAt).toDateString() === today
  }).length

  const avgMood = sessions.filter(s => s.moodScore).reduce((sum, s, _, arr) => sum + s.moodScore / arr.length, 0)

  return (
    <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
          <Icon name="Sparkles" size={13} className="text-violet-400" />
        </div>
        <span className="text-sm font-semibold text-white">Support Assistant Insights</span>
        <span className="ml-auto text-2xs text-slate-600 italic">Simulation data</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
          <span className="text-xs text-slate-400">Dominant patient state today</span>
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
          <span className="text-xs text-slate-400">Sessions completed today</span>
          <span className="text-xs font-mono text-teal-400">{completedToday}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
          <span className="text-xs text-slate-400">Avg mood score (all sessions)</span>
          <span className="text-xs font-mono text-teal-400">{avgMood > 0 ? avgMood.toFixed(1) : '--'}/10</span>
        </div>
        <div className="pt-1">
          <p className="text-2xs text-slate-500 leading-relaxed">
            <Icon name="Info" size={10} className="inline mr-1 text-slate-600" />
            This is a reflection support simulation. Data shown is for session tracking purposes only -- not clinical assessment.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Simulation Event Feed ────────────────────────────────────
function EventFeed({ events }) {
  if (events.length === 0) return (
    <div className="flex flex-col items-center py-8 text-slate-700 gap-2">
      <Icon name="Activity" size={24} className="opacity-20" />
      <span className="text-xs">No session events yet -- start a simulation to see events</span>
    </div>
  )
  return (
    <div className="space-y-1">
      {events.slice(0, 10).map(e => (
        <div key={e.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800/30 transition-colors">
          <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800/60 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="Activity" size={11} className="text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-300 truncate capitalize">{e.label || e.type?.replace(/_/g, ' ')}</div>
            {e.sessionId && <div className="text-2xs text-slate-600 truncate">Session {e.sessionId.slice(-6)}</div>}
          </div>
          <span className="text-2xs text-slate-700 font-mono flex-shrink-0">
            {new Date(e.ts).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Demo Seed Button ─────────────────────────────────────────
function DemoSeedBanner({ onSeed }) {
  return (
    <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon name="Sparkles" size={18} className="text-teal-400" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-white">No simulation data yet</div>
        <div className="text-xs text-slate-400 mt-0.5">Seed demo patients & sessions to explore the dashboard</div>
      </div>
      <button onClick={onSeed} className="flex-shrink-0 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-medium px-4 py-2 rounded-lg transition-colors">
        Load Demo Data
      </button>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { sessions } = useSessionStore()
  const { patients, setPatients } = usePatientStore()
  const { events } = useSimulationStore()
  const { addSession } = useSessionStore()

  const hasData = patients.length > 0 || sessions.length > 0

  const seedDemo = () => {
    const demoPatients = sessionSimulation.getDemoPatients()
    setPatients(demoPatients)
    demoPatients.forEach(p => {
      const history = sessionSimulation.generateDemoSessionHistory(p.id, p.name, 3)
      history.forEach(s => addSession(s))
    })
  }

  const activeSessions  = sessions.filter(s => s.phase !== SESSION_PHASES.COMPLETE)
  const completedToday  = sessions.filter(s => {
    const today = new Date().toDateString()
    return s.phase === SESSION_PHASES.COMPLETE && new Date(s.startedAt).toDateString() === today
  }).length
  const avgMood = sessions.filter(s => s.moodScore).reduce((sum, s, _, arr) => sum + s.moodScore / arr.length, 0)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">AP3X Therapy Session & Care Coordination Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Clinician overview · Session simulation &amp; wellbeing reflection system</p>
          </div>
          <LiveClock />
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 min-h-0">
        {/* Demo seed */}
        {!hasData && <DemoSeedBanner onSeed={seedDemo} />}

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Total Patients"     value={patients.length}    sub="in system"           icon="Users"        color="text-teal-400"    bg="bg-teal-500/5"    border="border-teal-500/15"    onClick={() => navigate('/patients')} />
          <KpiCard label="Active Sessions"    value={activeSessions.length} sub="in progress"       icon="CalendarCheck" color="text-violet-400"  bg="bg-violet-500/5"  border="border-violet-500/15" onClick={() => navigate('/sessions')} />
          <KpiCard label="Completed Today"    value={completedToday}     sub="sessions finished"   icon="CheckCircle"  color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/15" onClick={() => navigate('/sessions')} />
          <KpiCard label="Avg Mood Score"     value={avgMood > 0 ? avgMood.toFixed(1) : '--'} sub="across all sessions" icon="Heart" color="text-pink-400" bg="bg-pink-500/5" border="border-pink-500/15" onClick={() => navigate('/wellbeing')} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patient Cards */}
          <div className="lg:col-span-1 bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/40">
              <span className="text-sm font-semibold text-white">Patient Overview</span>
              <button onClick={() => navigate('/patients')} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">View all</button>
            </div>
            <div className="p-3 space-y-2">
              {patients.length === 0 ? (
                <div className="py-6 text-center text-slate-600 text-xs">No patients yet</div>
              ) : patients.slice(0, 5).map(p => (
                <PatientCard key={p.id} patient={p} onClick={() => navigate(`/patients/${p.id}`)} />
              ))}
            </div>
          </div>

          {/* Session Timeline */}
          <div className="lg:col-span-1 bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/40">
              <span className="text-sm font-semibold text-white">Session Timeline</span>
              <button onClick={() => navigate('/sessions')} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">View all</button>
            </div>
            <div className="p-3 space-y-1 max-h-80 overflow-y-auto scrollbar-none">
              {sessions.length === 0 ? (
                <div className="py-6 text-center text-slate-600 text-xs">No sessions recorded</div>
              ) : sessions.slice(0, 8).map(s => (
                <SessionTimelineRow key={s.id} session={s} />
              ))}
            </div>
          </div>

          {/* AI Insights + Event Feed */}
          <div className="lg:col-span-1 space-y-4">
            <AIInsightPanel sessions={sessions} patients={patients} />
            <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/40">
                <span className="text-sm font-semibold text-white">Session Event Stream</span>
                <span className="text-2xs text-slate-600 font-mono">{events.length} events</span>
              </div>
              <div className="p-3 max-h-48 overflow-y-auto scrollbar-none">
                <EventFeed events={events} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
