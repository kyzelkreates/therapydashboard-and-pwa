/**
 * ============================================================
 * AP3X -- Therapist Dashboard
 * Real-time overview: patient risk alerts, recent check-ins,
 * active sessions, AI risk signals, and quick-access actions.
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './components_ui_Icon'
import { usePatientStore, useSessionStore, useCheckinStore, useAppStore } from './core_storage'
import { patientSync }  from './services_sync_patientSync'
import { riskEngine, RISK_LEVELS, RISK_CONFIG, SIGNAL_TYPES } from './engine_riskEngine'
import sessionSimulation, { PATIENT_STATE_CONFIG } from './engine_sessionSimulation'

// ─── Live Clock ───────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
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

// ─── KPI card ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, bg, border, onClick, pulse }) {
  return (
    <div onClick={onClick} className={`${bg} border ${border} rounded-xl p-4 cursor-pointer hover:brightness-110 transition-all group`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xs text-slate-500 font-semibold tracking-widest uppercase">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center relative`}>
          <Icon name={icon} size={14} className={color} />
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
        </div>
      </div>
      <div className={`font-mono text-3xl font-bold ${color} tabular-nums`}>{value ?? '--'}</div>
      {sub && <div className="text-2xs text-slate-600 mt-1.5">{sub}</div>}
    </div>
  )
}

// ─── Risk badge ───────────────────────────────────────────────
function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.none
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <Icon name={cfg.icon} size={9} />
      {cfg.label}
      {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-0.5" />}
    </span>
  )
}

// ─── Risk alert card ──────────────────────────────────────────
function RiskAlertCard({ assessment, onView, onDismiss }) {
  const cfg     = RISK_CONFIG[assessment.level]
  const topSig  = assessment.signals[0]

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border} group`}>
      <div className={`w-9 h-9 rounded-full bg-slate-900/40 border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
        <Icon name={cfg.icon} size={16} className={`${cfg.color} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{assessment.patientName}</span>
          <RiskBadge level={assessment.level} />
        </div>
        {topSig && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{topSig.message}</p>
        )}
        <div className="text-2xs text-slate-600 mt-1">
          {assessment.signals.length} signal{assessment.signals.length !== 1 ? 's' : ''} detected
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button onClick={() => onView(assessment.patientId)}
          className="text-2xs bg-slate-800/60 border border-slate-700/60 text-slate-300 px-2 py-1 rounded-md hover:text-white transition-colors">
          View
        </button>
        <button onClick={() => onDismiss(assessment.patientId)}
          className="text-2xs text-slate-600 hover:text-slate-400 transition-colors px-1">
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ─── Recent check-in row ──────────────────────────────────────
function CheckinRow({ checkin }) {
  const score = checkin.moodScore
  const color = score >= 7 ? 'text-teal-400' : score >= 5 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/30 transition-colors">
      <div className="w-8 h-8 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-slate-300">
          {checkin.patientName?.split(' ').map(w=>w[0]).join('').slice(0,2) || '??'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{checkin.patientName || 'Unknown'}</div>
        <div className="text-2xs text-slate-500 capitalize">{checkin.mood} · {new Date(checkin.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`font-mono font-bold text-sm ${color}`}>{checkin.moodScore}/10</span>
      </div>
    </div>
  )
}

// ─── Active session row ───────────────────────────────────────
function ActiveSessionRow({ session }) {
  const elapsed = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-teal-500/5 border border-teal-500/10">
      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{session.patientName}</div>
        <div className="text-2xs text-teal-400/60">Session in progress · {elapsed} min</div>
      </div>
      <span className="text-2xs bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Live</span>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { patients, setPatients }     = usePatientStore()
  const { sessions, setSessions }     = useSessionStore()
  const { checkins, addCheckin }      = useCheckinStore()
  const { addAlert }                  = useAppStore()

  const [riskAssessments, setRiskAssessments] = useState([])
  const [dismissedIds, setDismissedIds]        = useState(() => {
    try { return JSON.parse(localStorage.getItem('ap3x:dismissed_risks') || '[]') } catch { return [] }
  })
  const [liveCheckins, setLiveCheckins] = useState([])
  const [activeSessions, setActiveSessions] = useState([])

  // ── Load + run risk analysis ───────────────────────────────
  const runAnalysis = useCallback(() => {
    const allCheckins    = patientSync.getAllCheckins()
    const allReflections = patientSync.getAllReflections()
    const allSessions    = patientSync.getAllSessions()
    const allPatients    = patients.length > 0 ? patients : patientSync.getAllPatients()

    // Merge stored sessions with sync sessions
    const mergedSessions = [...allSessions, ...sessions].filter((s, i, arr) =>
      arr.findIndex(x => x.id === s.id) === i
    )

    // Merge check-ins
    const mergedCheckins = [...allCheckins, ...checkins].filter((c, i, arr) =>
      arr.findIndex(x => x.id === c.id) === i
    ).sort((a, b) => new Date(b.ts) - new Date(a.ts))

    setLiveCheckins(mergedCheckins.slice(0, 10))

    const active = mergedSessions.filter(s => s.phase !== 'complete' && s.startedAt &&
      Date.now() - new Date(s.startedAt).getTime() < 2 * 60 * 60 * 1000
    )
    setActiveSessions(active)

    if (allPatients.length > 0) {
      const results = riskEngine.analyseAll(allPatients, mergedSessions, mergedCheckins, allReflections)
      setRiskAssessments(results.filter(r => r.level !== RISK_LEVELS.NONE && !dismissedIds.includes(r.patientId)))
    }
  }, [patients, sessions, checkins, dismissedIds])

  // ── Seed demo data if no patients ─────────────────────────
  useEffect(() => {
    if (patients.length === 0) {
      const demoPts = sessionSimulation.getDemoPatients()
      setPatients(demoPts)
      const result = patientSync.seedDemoData(demoPts)
      const demoPtHistory = demoPts.flatMap(p => sessionSimulation.generateDemoSessionHistory(p.id, p.name, 5))
      setSessions(demoPtHistory)
    }
  }, [])

  useEffect(() => { runAnalysis() }, [runAnalysis])

  // ── Live sync via BroadcastChannel ────────────────────────
  useEffect(() => {
    const unsub = patientSync.onUpdate((msg) => {
      if (['checkin', 'reflection', 'session', 'demo_seeded'].includes(msg.type)) {
        runAnalysis()
        if (msg.type === 'checkin') {
          addAlert({ title: 'New Check-in', message: `${msg.payload.patientName} submitted a check-in (mood: ${msg.payload.mood})`, type: 'info' })
        }
      }
    })
    return unsub
  }, [runAnalysis])

  // ── Poll every 30s as fallback ─────────────────────────────
  useEffect(() => {
    const id = setInterval(runAnalysis, 30000)
    return () => clearInterval(id)
  }, [runAnalysis])

  const dismissRisk = (patientId) => {
    const next = [...dismissedIds, patientId]
    setDismissedIds(next)
    localStorage.setItem('ap3x:dismissed_risks', JSON.stringify(next))
    setRiskAssessments(prev => prev.filter(r => r.patientId !== patientId))
  }

  // ── Stats ──────────────────────────────────────────────────
  const allCheckins    = patientSync.getAllCheckins()
  const todayCheckins  = allCheckins.filter(c => new Date(c.ts).toDateString() === new Date().toDateString())
  const highRisk       = riskAssessments.filter(r => r.level === RISK_LEVELS.HIGH || r.level === RISK_LEVELS.CRITICAL)
  const allSessions    = [...patientSync.getAllSessions(), ...sessions].filter((s,i,arr)=>arr.findIndex(x=>x.id===s.id)===i)

  return (
    <div className="p-5 space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Clinician Dashboard</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {patients.length} patients · AI risk monitoring active
          </p>
        </div>
        <LiveClock />
      </div>

      {/* Critical alerts (top priority) */}
      {riskAssessments.filter(r => r.level === RISK_LEVELS.CRITICAL).length > 0 && (
        <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="ShieldAlert" size={16} className="text-red-400 animate-pulse" />
            <span className="text-sm font-bold text-red-300">CRITICAL ALERTS — Immediate Review Required</span>
          </div>
          {riskAssessments.filter(r => r.level === RISK_LEVELS.CRITICAL).map(a => (
            <RiskAlertCard key={a.patientId} assessment={a}
              onView={id => navigate(`/patients/${id}`)}
              onDismiss={dismissRisk} />
          ))}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Patients"       value={patients.length}      icon="Users"        color="text-teal-400"    bg="bg-teal-500/5"    border="border-teal-500/15"    sub="Under care"            onClick={() => navigate('/patients')} />
        <KpiCard label="Check-ins Today" value={todayCheckins.length} icon="Heart"        color="text-violet-400" bg="bg-violet-500/5"  border="border-violet-500/15"  sub="Submissions today"    onClick={() => navigate('/wellbeing')} />
        <KpiCard label="Risk Flags"     value={riskAssessments.length} icon="AlertTriangle" color="text-amber-400" bg="bg-amber-500/5"  border="border-amber-500/15"   sub={`${highRisk.length} high/critical`} pulse={highRisk.length > 0} onClick={() => navigate('/patients')} />
        <KpiCard label="Sessions Total" value={allSessions.length}   icon="CalendarCheck" color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/15" sub="All time"             onClick={() => navigate('/sessions')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Risk Panel */}
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Brain" size={14} className="text-amber-400" />
              <span className="text-sm font-semibold text-white">AI Risk Monitor</span>
              <span className="text-2xs bg-teal-500/10 border border-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded-full">Live</span>
            </div>
            <button onClick={runAnalysis} className="text-2xs text-slate-500 hover:text-slate-300 transition-colors">
              <Icon name="RefreshCw" size={11} className="inline mr-1" />Refresh
            </button>
          </div>
          <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
            {riskAssessments.length === 0 ? (
              <div className="py-6 text-center">
                <Icon name="ShieldCheck" size={24} className="text-teal-400/40 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No risk signals detected across all patients.</p>
              </div>
            ) : (
              riskAssessments.filter(r => r.level !== RISK_LEVELS.CRITICAL).map(a => (
                <RiskAlertCard key={a.patientId} assessment={a}
                  onView={id => navigate(`/patients/${id}`)}
                  onDismiss={dismissRisk} />
              ))
            )}
          </div>
        </div>

        {/* Right column: Active sessions + Recent check-ins */}
        <div className="space-y-4">

          {/* Active sessions */}
          {activeSessions.length > 0 && (
            <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/40 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-sm font-semibold text-white">Active Sessions</span>
              </div>
              <div className="p-2 space-y-1">
                {activeSessions.map(s => <ActiveSessionRow key={s.id} session={s} />)}
              </div>
            </div>
          )}

          {/* Recent check-ins */}
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Heart" size={14} className="text-violet-400" />
                <span className="text-sm font-semibold text-white">Recent Check-ins</span>
              </div>
              <button onClick={() => navigate('/wellbeing')} className="text-2xs text-slate-500 hover:text-slate-300">See all</button>
            </div>
            <div className="divide-y divide-slate-800/40">
              {liveCheckins.length === 0 ? (
                <div className="py-6 text-center">
                  <Icon name="Inbox" size={20} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No check-ins yet. They appear here in real-time.</p>
                </div>
              ) : (
                liveCheckins.slice(0, 6).map(c => <CheckinRow key={c.id} checkin={c} />)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient summary with risk levels */}
      <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Users" size={14} className="text-teal-400" />
            <span className="text-sm font-semibold text-white">Patient Overview</span>
          </div>
          <button onClick={() => navigate('/patients')} className="text-2xs text-slate-500 hover:text-slate-300">View all</button>
        </div>
        <div className="divide-y divide-slate-800/30">
          {patients.slice(0, 8).map(p => {
            const assessment = riskAssessments.find(r => r.patientId === p.id)
            const stCfg = PATIENT_STATE_CONFIG[p.state] || PATIENT_STATE_CONFIG.neutral
            return (
              <div key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-teal-400">{p.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{p.name}</div>
                  <div className="text-2xs text-slate-500">{p.sessions} sessions · Last: {p.lastSession}</div>
                </div>
                <div className="flex items-center gap-2">
                  {assessment ? (
                    <RiskBadge level={assessment.level} />
                  ) : (
                    <span className={`text-2xs px-2 py-0.5 rounded-full border ${stCfg.bg} ${stCfg.border} ${stCfg.color}`}>
                      {stCfg.label}
                    </span>
                  )}
                  <Icon name="ChevronRight" size={12} className="text-slate-600" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-2xs text-slate-700 text-center leading-relaxed pb-2">
        AI risk signals are for clinical decision support only. All outputs require professional review.
        Not a substitute for clinical judgement.
      </p>
    </div>
  )
}
