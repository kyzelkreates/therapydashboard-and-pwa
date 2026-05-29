/**
 * ============================================================
 * AP3X -- Reflections & Notes Page
 * ============================================================
 */

import { useState } from 'react'
import Icon from './components_ui_Icon'
import { useReflectionStore, usePatientStore } from './core_storage'
import sessionSimulation from './engine_sessionSimulation'

export default function Reflections() {
  const { reflections, addReflection } = useReflectionStore()
  const { patients } = usePatientStore()
  const [prompt, setPrompt] = useState(sessionSimulation.getReflectionPrompt())
  const [response, setResponse] = useState('')
  const [selectedPatient, setSelectedPatient] = useState('')

  const submit = () => {
    if (!response.trim()) return
    addReflection({
      id:        `ref_${Date.now()}`,
      patientId: selectedPatient || 'anonymous',
      patientName: patients.find(p => p.id === selectedPatient)?.name || 'Anonymous',
      sessionId: null,
      ts:        new Date().toISOString(),
      prompt,
      response: response.trim(),
      tags:      [],
    })
    setResponse('')
    setPrompt(sessionSimulation.getReflectionPrompt())
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800/60">
        <h1 className="text-lg font-bold text-white">Reflections & Notes</h1>
        <p className="text-xs text-slate-500 mt-0.5">Session reflection records -- non-clinical tracking only</p>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Reflection */}
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="BookOpen" size={16} className="text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Add Reflection</h2>
            <button onClick={() => setPrompt(sessionSimulation.getReflectionPrompt())}
              className="ml-auto text-2xs text-slate-500 hover:text-teal-300 transition-colors flex items-center gap-1">
              <Icon name="RefreshCw" size={10} />New prompt
            </button>
          </div>
          <div className="bg-teal-500/5 border border-teal-500/15 rounded-lg p-3">
            <p className="text-sm text-teal-300 italic">"{prompt}"</p>
          </div>
          {patients.length > 0 && (
            <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-800/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
              <option value="">-- Select patient (optional) --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <textarea value={response} onChange={e => setResponse(e.target.value)}
            placeholder="Enter reflection response…"
            rows={5}
            className="w-full bg-slate-800/40 border border-slate-800/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/40 resize-none" />
          <button onClick={submit} disabled={!response.trim()}
            className="w-full bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-40">
            Save Reflection
          </button>
        </div>

        {/* Reflection History */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white px-1">Reflection History</h2>
          {reflections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2">
              <Icon name="BookOpen" size={28} className="opacity-20" />
              <p className="text-sm">No reflections yet</p>
            </div>
          ) : reflections.map(r => (
            <div key={r.id} className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-xs font-medium text-teal-300">{r.patientName || 'Anonymous'}</span>
                <span className="text-2xs text-slate-600 font-mono">{new Date(r.ts).toLocaleDateString('en-GB')}</span>
              </div>
              <p className="text-2xs text-slate-500 italic mb-1.5">"{r.prompt}"</p>
              <p className="text-sm text-slate-300">{r.response}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
