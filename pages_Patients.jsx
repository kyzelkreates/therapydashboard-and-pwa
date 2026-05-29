/**
 * ============================================================
 * AP3X -- Patients Page
 * Patient overview, activity cards, state tracking
 * ============================================================
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from './components_ui_Icon'
import { usePatientStore, useSessionStore } from './core_storage'
import sessionSimulation, { PATIENT_STATE_CONFIG, SESSION_PHASES } from './engine_sessionSimulation'

function StateBadge({ state }) {
  const cfg = PATIENT_STATE_CONFIG[state] || PATIENT_STATE_CONFIG.neutral
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ${cfg.bg} ${cfg.border} border ${cfg.color}`}>
      <Icon name={cfg.icon} size={9} />{cfg.label}
    </span>
  )
}

function PatientDetailPanel({ patient, sessions }) {
  const ptSessions = sessions.filter(s => s.patientId === patient.id)
  const completed  = ptSessions.filter(s => s.phase === SESSION_PHASES.COMPLETE)
  const avgMood    = completed.filter(s => s.moodScore).reduce((sum, s, _, arr) => sum + s.moodScore / arr.length, 0)

  return (
    <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/40 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <span className="text-lg font-bold text-teal-400">{patient.initials}</span>
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{patient.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">Age {patient.age}</span>
            <StateBadge state={patient.state} />
          </div>
        </div>
      </div>
      <div className="p-5 grid grid-cols-3 gap-4 border-b border-slate-800/40">
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-teal-400">{ptSessions.length}</div>
          <div className="text-2xs text-slate-500 mt-0.5">Total Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-emerald-400">{completed.length}</div>
          <div className="text-2xs text-slate-500 mt-0.5">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-violet-400">{avgMood > 0 ? avgMood.toFixed(1) : '--'}</div>
          <div className="text-2xs text-slate-500 mt-0.5">Avg Mood</div>
        </div>
      </div>
      {patient.tags?.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-800/40 flex flex-wrap gap-2">
          {patient.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-700/40 border border-slate-700/60 text-2xs text-slate-400">{tag}</span>
          ))}
        </div>
      )}
      <div className="p-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Session History</h3>
        {ptSessions.length === 0 ? (
          <p className="text-sm text-slate-600">No sessions recorded for this patient.</p>
        ) : (
          <div className="space-y-2">
            {ptSessions.slice(0, 6).map(s => {
              const cfg = PATIENT_STATE_CONFIG[s.state] || PATIENT_STATE_CONFIG.neutral
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-800/40">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.phase === SESSION_PHASES.COMPLETE ? 'bg-teal-400' : 'bg-amber-400 animate-pulse'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white capitalize">{s.phase?.replace('_', ' ')}</div>
                    <div className="text-2xs text-slate-600">{new Date(s.startedAt).toLocaleDateString('en-GB')}</div>
                  </div>
                  <StateBadge state={s.state} />
                  {s.moodScore && <span className="text-2xs font-mono text-teal-400 flex-shrink-0">{s.moodScore}/10</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Patients() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const { patients, setPatients } = usePatientStore()
  const { sessions } = useSessionStore()
  const [search, setSearch] = useState('')

  const selectedPatient = patientId ? patients.find(p => p.id === patientId) : null
  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const seedPatients = () => setPatients(sessionSimulation.getDemoPatients())

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className="w-80 flex-shrink-0 border-r border-slate-800/60 flex flex-col h-full">
        <div className="px-4 py-4 border-b border-slate-800/40 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Patients</h2>
            <button onClick={seedPatients} className="text-2xs text-teal-400 hover:text-teal-300 border border-teal-500/20 px-2 py-1 rounded transition-colors">Seed Demo</button>
          </div>
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients…"
              className="w-full bg-slate-800/40 border border-slate-800/60 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/40" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-2">
          {filtered.map(p => {
            const cfg = PATIENT_STATE_CONFIG[p.state] || PATIENT_STATE_CONFIG.neutral
            const isActive = selectedPatient?.id === p.id
            return (
              <div key={p.id} onClick={() => navigate(`/patients/${p.id}`)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-teal-500/5 border-teal-500/20' : 'bg-slate-800/20 border-slate-800/40 hover:bg-slate-800/40'}`}>
                <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-teal-400">{p.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                  <div className="text-2xs text-slate-500">{p.sessions} sessions</div>
                </div>
                <span className={`text-2xs ${cfg.color}`}><Icon name={cfg.icon} size={12} /></span>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="py-10 text-center text-slate-600 text-xs">No patients found</div>}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedPatient ? (
          <PatientDetailPanel patient={selectedPatient} sessions={sessions} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
            <Icon name="Users" size={36} className="opacity-20" />
            <p className="text-sm">Select a patient to view their profile</p>
          </div>
        )}
      </div>
    </div>
  )
}
