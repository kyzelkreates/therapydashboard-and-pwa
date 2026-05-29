/**
 * ============================================================
 * AP3X -- Patients Page
 * Patient profiles with full AI risk breakdown per patient.
 * ============================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Icon from './components_ui_Icon'
import { usePatientStore, useSessionStore, useCheckinStore } from './core_storage'
import { patientSync }  from './services_sync_patientSync'
import { riskEngine, RISK_LEVELS, RISK_CONFIG, SIGNAL_TYPES } from './engine_riskEngine'
import { PATIENT_STATE_CONFIG } from './engine_sessionSimulation'

function StateBadge({ state }) {
  const cfg = PATIENT_STATE_CONFIG[state] || PATIENT_STATE_CONFIG.neutral
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <Icon name={cfg.icon} size={9} />{cfg.label}
    </span>
  )
}

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

function RiskSignalRow({ signal }) {
  const cfg = RISK_CONFIG[signal.level] || RISK_CONFIG.none
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <Icon name={cfg.icon} size={14} className={`${cfg.color} flex-shrink-0 mt-0.5 ${cfg.pulse ? 'animate-pulse' : ''}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <RiskBadge level={signal.level} />
          <span className="text-2xs text-slate-500 capitalize">{signal.type.replace(/_/g,' ')}</span>
        </div>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{signal.message}</p>
      </div>
    </div>
  )
}

function PatientRiskPanel({ patient, assessment }) {
  const cfg = RISK_CONFIG[assessment?.level || RISK_LEVELS.NONE]
  if (!assessment) return (
    <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4 text-center">
      <Icon name="Brain" size={20} className="text-slate-600 mx-auto mb-2" />
      <p className="text-xs text-slate-500">No risk data yet. Submit a check-in to begin analysis.</p>
    </div>
  )

  return (
    <div className={`bg-slate-800/20 border ${assessment.level !== RISK_LEVELS.NONE ? cfg.border : 'border-slate-800/60'} rounded-xl overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${assessment.level !== RISK_LEVELS.NONE ? cfg.border : 'border-slate-800/40'} flex items-center gap-2`}>
        <Icon name="Brain" size={14} className={cfg.color} />
        <span className="text-sm font-semibold text-white">AI Risk Assessment</span>
        <RiskBadge level={assessment.level} />
        <span className="ml-auto text-2xs text-slate-600">
          {new Date(assessment.analysedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="p-3 space-y-2">
        {assessment.signals.length === 0 ? (
          <div className="py-3 text-center">
            <Icon name="ShieldCheck" size={20} className="text-teal-400/40 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No risk signals detected.</p>
          </div>
        ) : (
          assessment.signals.map((sig, i) => <RiskSignalRow key={i} signal={sig} />)
        )}
      </div>
      <div className="px-4 py-2.5 border-t border-slate-800/40 bg-slate-900/20">
        <p className="text-2xs text-slate-600 leading-relaxed">
          AI signals are for clinical decision support only. Always apply professional judgement.
        </p>
      </div>
    </div>
  )
}

function MoodChart({ checkins }) {
  if (checkins.length < 2) return (
    <div className="text-center py-6">
      <p className="text-xs text-slate-500">Not enough check-ins for a chart yet.</p>
    </div>
  )
  const data = checkins.slice(0, 12).reverse().map(c => ({
    date: new Date(c.ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    mood: c.moodScore,
    energy: c.energyScore,
  }))
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
        <YAxis domain={[0, 10]} tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#0f1929', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Line type="monotone" dataKey="mood" stroke="#2dd4bf" strokeWidth={2} dot={false} name="Mood" />
        <Line type="monotone" dataKey="energy" stroke="#a78bfa" strokeWidth={2} dot={false} name="Energy" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function PatientDetailPanel({ patient }) {
  const { sessions } = useSessionStore()
  const { checkins } = useCheckinStore()
  const [assessment, setAssessment] = useState(null)

  const ptSessions = [
    ...patientSync.getPatientSessions(patient.id),
    ...sessions.filter(s => s.patientId === patient.id),
  ].filter((s,i,arr)=>arr.findIndex(x=>x.id===s.id)===i)

  const ptCheckins = [
    ...patientSync.getPatientCheckins(patient.id),
    ...checkins.filter(c => c.patientId === patient.id),
  ].filter((c,i,arr)=>arr.findIndex(x=>x.id===c.id)===i)
  .sort((a,b)=>new Date(b.ts)-new Date(a.ts))

  const ptReflections = patientSync.getPatientReflections(patient.id)

  useEffect(() => {
    const result = riskEngine.analysePatient(patient, ptSessions, ptCheckins, ptReflections)
    setAssessment(result)
  }, [patient.id])

  const completed = ptSessions.filter(s => s.phase === 'complete')
  const avgMood   = ptCheckins.length > 0
    ? (ptCheckins.reduce((sum, c) => sum + (c.moodScore || 5), 0) / ptCheckins.length).toFixed(1)
    : '--'

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <span className="text-lg font-bold text-teal-400">{patient.initials}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{patient.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">Age {patient.age}</span>
              <StateBadge state={patient.state} />
              {assessment && <RiskBadge level={assessment.level} />}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-mono font-bold text-teal-400">{ptSessions.length}</div>
            <div className="text-2xs text-slate-500">Sessions</div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-violet-400">{ptCheckins.length}</div>
            <div className="text-2xs text-slate-500">Check-ins</div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-amber-400">{avgMood}</div>
            <div className="text-2xs text-slate-500">Avg Mood</div>
          </div>
        </div>
        {patient.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {patient.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-700/40 border border-slate-700/60 text-2xs text-slate-400">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Mood chart */}
      {ptCheckins.length > 0 && (
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Mood & Energy Trend</h3>
          <MoodChart checkins={ptCheckins} />
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-400 inline-block rounded" /><span className="text-2xs text-slate-500">Mood</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-400 inline-block rounded" /><span className="text-2xs text-slate-500">Energy</span></div>
          </div>
        </div>
      )}

      {/* Risk panel */}
      <PatientRiskPanel patient={patient} assessment={assessment} />

      {/* Recent check-ins */}
      {ptCheckins.length > 0 && (
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/40">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Recent Check-ins</span>
          </div>
          <div className="divide-y divide-slate-800/30">
            {ptCheckins.slice(0,5).map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1">
                  <div className="text-xs text-slate-300 capitalize">{c.mood}</div>
                  <div className="text-2xs text-slate-600">{new Date(c.ts).toLocaleDateString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
                  {c.notes && <div className="text-2xs text-slate-400 mt-0.5 line-clamp-1 italic">"{c.notes}"</div>}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-mono font-bold ${c.moodScore >= 7 ? 'text-teal-400' : c.moodScore >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{c.moodScore}/10</div>
                  <div className="text-2xs text-slate-600">mood</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Patients() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const { patients } = usePatientStore()
  const { sessions }  = useSessionStore()
  const { checkins }  = useCheckinStore()
  const [search, setSearch] = useState('')
  const [riskMap, setRiskMap] = useState({})

  useEffect(() => {
    if (patients.length === 0) return
    const allCheckins    = [...patientSync.getAllCheckins(), ...checkins].filter((c,i,arr)=>arr.findIndex(x=>x.id===c.id)===i)
    const allSessions    = [...patientSync.getAllSessions(), ...sessions].filter((s,i,arr)=>arr.findIndex(x=>x.id===s.id)===i)
    const allReflections = patientSync.getAllReflections()
    const results = riskEngine.analyseAll(patients, allSessions, allCheckins, allReflections)
    const map = {}
    results.forEach(r => { map[r.patientId] = r.level })
    setRiskMap(map)
  }, [patients])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const selected = patientId ? patients.find(p => p.id === patientId) : null

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 border-r border-slate-800/60 flex-shrink-0`}>
        <div className="p-4 border-b border-slate-800/40">
          <h1 className="text-base font-bold text-white mb-3">Patients</h1>
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-800/40 border border-slate-700/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map(p => {
            const riskLevel = riskMap[p.id] || RISK_LEVELS.NONE
            const rCfg      = RISK_CONFIG[riskLevel]
            const isActive  = selected?.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border text-left ${
                  isActive ? 'bg-teal-500/5 border-teal-500/20' : 'bg-slate-800/20 border-slate-800/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-teal-400">{p.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                  <div className="text-2xs text-slate-500">{p.sessions} sessions</div>
                </div>
                {riskLevel !== RISK_LEVELS.NONE && (
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    riskLevel === RISK_LEVELS.CRITICAL ? 'bg-red-400 animate-pulse' :
                    riskLevel === RISK_LEVELS.HIGH     ? 'bg-orange-400' :
                    riskLevel === RISK_LEVELS.MODERATE ? 'bg-amber-400' : 'bg-teal-400'
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail */}
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 flex-col overflow-y-auto`}>
        {selected ? (
          <>
            {/* Mobile back */}
            <div className="lg:hidden px-4 py-3 border-b border-slate-800/40">
              <button onClick={() => navigate('/patients')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
                <Icon name="ChevronLeft" size={14} />Back
              </button>
            </div>
            <PatientDetailPanel patient={selected} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <Icon name="Users" size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Select a patient to view their profile and risk assessment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
