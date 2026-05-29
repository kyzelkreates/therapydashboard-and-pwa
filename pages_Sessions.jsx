/**
 * ============================================================
 * AP3X -- Sessions Page
 * Session history explorer, detail view, simulation trigger
 * ============================================================
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from './components_ui_Icon'
import { useSessionStore, usePatientStore, useSimulationStore } from './core_storage'
import sessionSimulation, { PATIENT_STATE_CONFIG, SESSION_PHASES, SESSION_EVENTS } from './engine_sessionSimulation'

function PhaseBadge({ phase }) {
  const colors = {
    [SESSION_PHASES.COMPLETE]:   'text-teal-400 bg-teal-500/10 border-teal-500/20',
    [SESSION_PHASES.SUMMARY]:    'text-violet-400 bg-violet-500/10 border-violet-500/20',
    [SESSION_PHASES.GUIDED]:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
    [SESSION_PHASES.REFLECTION]: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    [SESSION_PHASES.CHECK_IN]:   'text-slate-300 bg-slate-500/10 border-slate-500/20',
  }
  const label = phase?.replace('_', ' ') || 'unknown'
  const cls   = colors[phase] || colors[SESSION_PHASES.CHECK_IN]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium border capitalize ${cls}`}>{label}</span>
}

function SessionDetailPanel({ session }) {
  const cfg = PATIENT_STATE_CONFIG[session.state] || PATIENT_STATE_CONFIG.neutral
  const events = sessionSimulation.buildEventStream(session)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">{session.patientName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <PhaseBadge phase={session.phase} />
              <span className={`text-xs ${cfg.color}`}><Icon name={cfg.icon} size={12} className="inline mr-1" />{cfg.label}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">{new Date(session.startedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div className="text-xs text-slate-600">{new Date(session.startedAt).toLocaleTimeString('en-GB', { hour12: false })}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-mono font-bold text-teal-400">{session.moodScore ?? '--'}</div>
            <div className="text-2xs text-slate-500">Mood Score /10</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-mono font-bold text-violet-400">{session.energyScore ?? '--'}</div>
            <div className="text-2xs text-slate-500">Energy Score /10</div>
          </div>
        </div>
      </div>

      {/* Check-in */}
      {session.checkIn && (
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Check-in</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white capitalize">{session.checkIn.mood}</span>
            <span className="text-2xs text-slate-500">· Mood: {session.checkIn.moodScore}/10 · Energy: {session.checkIn.energyScore}/10</span>
          </div>
        </div>
      )}

      {/* Reflection */}
      {session.reflection && (
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Reflection</h3>
          <p className="text-xs text-teal-300 italic mb-2">"{session.reflection.prompt}"</p>
          <p className="text-sm text-slate-300">{session.reflection.response}</p>
        </div>
      )}

      {/* AI Prompts */}
      {session.aiPrompts?.length > 0 && (
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Support Assistant Prompts</h3>
          <div className="space-y-2">
            {session.aiPrompts.map((p, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <Icon name="Sparkles" size={12} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">{p.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {session.summary && (
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Session Summary</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{session.summary}</p>
          <p className="text-2xs text-slate-600 mt-3 italic">Non-clinical session summary -- for reflection tracking only</p>
        </div>
      )}

      {/* Event Timeline */}
      <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Session Event Timeline</h3>
        <div className="relative pl-4">
          <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-800/60" />
          <div className="space-y-3">
            {events.map((e, i) => (
              <div key={i} className="relative flex items-center gap-3">
                <div className="absolute -left-3 w-2 h-2 rounded-full bg-teal-400 border-2 border-slate-900" />
                <span className="text-2xs font-mono text-slate-600 w-12 flex-shrink-0">{new Date(e.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-xs text-slate-300">{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sessions() {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const { sessions, addSession } = useSessionStore()
  const { patients }             = usePatientStore()
  const { addEvent }             = useSimulationStore()
  const [filter, setFilter]      = useState('all')

  const selectedSession = sessionId ? sessions.find(s => s.id === sessionId) : null

  const filtered = sessions.filter(s => {
    if (filter === 'active')   return s.phase !== SESSION_PHASES.COMPLETE
    if (filter === 'complete') return s.phase === SESSION_PHASES.COMPLETE
    return true
  })

  const runSimulation = () => {
    if (patients.length === 0) return alert('Seed patients first from the Patients page.')
    const p = patients[Math.floor(Math.random() * patients.length)]
    const session = sessionSimulation.generateSession(p.id, p.name)
    session.checkIn   = sessionSimulation.generateCheckin(p.id)
    session.reflection = { prompt: sessionSimulation.getReflectionPrompt(), response: 'Simulated reflection response from patient.' }
    session.aiPrompts  = [sessionSimulation.generateAIPrompt()]
    session.summary    = sessionSimulation.generateSummary(p.name, session.state)
    session.moodScore  = session.checkIn.moodScore
    session.energyScore = session.checkIn.energyScore
    session.phase      = SESSION_PHASES.COMPLETE
    session.completedAt = new Date().toISOString()
    addSession(session)
    const evts = sessionSimulation.buildEventStream(session)
    evts.forEach(e => addEvent(e))
    navigate(`/sessions/${session.id}`)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className="w-80 flex-shrink-0 border-r border-slate-800/60 flex flex-col h-full">
        <div className="px-4 py-4 border-b border-slate-800/40 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Session History</h2>
            <button onClick={runSimulation} className="flex items-center gap-1.5 text-2xs text-teal-300 border border-teal-500/20 bg-teal-500/5 px-2.5 py-1.5 rounded-lg hover:bg-teal-500/10 transition-colors">
              <Icon name="Play" size={10} />Simulate
            </button>
          </div>
          <div className="flex gap-1">
            {['all', 'active', 'complete'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 text-2xs py-1.5 rounded-lg capitalize transition-colors ${filter === f ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-2">
          {filtered.map(s => {
            const cfg = PATIENT_STATE_CONFIG[s.state] || PATIENT_STATE_CONFIG.neutral
            const isActive = selectedSession?.id === s.id
            return (
              <div key={s.id} onClick={() => navigate(`/sessions/${s.id}`)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-teal-500/5 border-teal-500/20' : 'bg-slate-800/20 border-slate-800/40 hover:bg-slate-800/40'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white truncate">{s.patientName}</span>
                  <PhaseBadge phase={s.phase} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xs ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-2xs text-slate-600">{new Date(s.startedAt).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="py-10 text-center text-slate-600 text-xs">No sessions yet -- run a simulation</div>}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedSession ? (
          <SessionDetailPanel session={selectedSession} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
            <Icon name="CalendarCheck" size={36} className="opacity-20" />
            <p className="text-sm">Select a session to view details</p>
            <button onClick={runSimulation} className="mt-2 text-xs text-teal-300 border border-teal-500/20 bg-teal-500/5 px-4 py-2 rounded-lg hover:bg-teal-500/10 transition-colors flex items-center gap-2">
              <Icon name="Play" size={12} />Run Session Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
