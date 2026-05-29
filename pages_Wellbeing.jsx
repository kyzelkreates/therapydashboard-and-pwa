/**
 * ============================================================
 * AP3X -- Wellbeing Tracker
 * Mood/energy logs, progress indicators (non-medical)
 * ============================================================
 */

import { useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Icon from './components_ui_Icon'
import { useCheckinStore, usePatientStore, useSessionStore } from './core_storage'

const MOOD_OPTIONS = ['great', 'good', 'okay', 'low', 'anxious', 'tired', 'hopeful', 'overwhelmed', 'calm']

const MoodTag = ({ mood, selected, onClick }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize border ${selected ? 'bg-teal-500/15 border-teal-500/30 text-teal-300' : 'bg-slate-800/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700/60'}`}>
    {mood}
  </button>
)

const ScoreSlider = ({ label, value, onChange, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-mono font-bold ${color}`}>{value}/10</span>
    </div>
    <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-teal-400" />
  </div>
)

export default function Wellbeing() {
  const { checkins, addCheckin } = useCheckinStore()
  const { patients } = usePatientStore()
  const { sessions } = useSessionStore()
  const [mood, setMood] = useState('okay')
  const [moodScore, setMoodScore] = useState(6)
  const [energyScore, setEnergyScore] = useState(5)
  const [notes, setNotes] = useState('')
  const [selectedPatient, setSelectedPatient] = useState('')

  const submitCheckin = () => {
    addCheckin({
      id: `chk_${Date.now()}`,
      patientId: selectedPatient || 'anonymous',
      patientName: patients.find(p => p.id === selectedPatient)?.name || 'Anonymous',
      ts: new Date().toISOString(),
      mood, moodScore, energyScore, notes: notes.trim(),
    })
    setNotes('')
    setMood('okay')
    setMoodScore(6)
    setEnergyScore(5)
  }

  // Build chart data from checkins
  const chartData = checkins.slice(0, 14).reverse().map((c, i) => ({
    day: new Date(c.ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    mood: c.moodScore,
    energy: c.energyScore,
  }))

  const avgMood   = checkins.length ? (checkins.reduce((s, c) => s + c.moodScore, 0) / checkins.length).toFixed(1) : '--'
  const avgEnergy = checkins.length ? (checkins.reduce((s, c) => s + c.energyScore, 0) / checkins.length).toFixed(1) : '--'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800/60">
        <h1 className="text-lg font-bold text-white">Wellbeing Tracker</h1>
        <p className="text-xs text-slate-500 mt-0.5">Mood & energy logging -- non-medical reflection tracking only</p>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-teal-500/5 border border-teal-500/15 rounded-xl p-4 text-center">
            <div className="text-3xl font-mono font-bold text-teal-400">{checkins.length}</div>
            <div className="text-2xs text-slate-500 mt-1">Check-ins Logged</div>
          </div>
          <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 text-center">
            <div className="text-3xl font-mono font-bold text-violet-400">{avgMood}</div>
            <div className="text-2xs text-slate-500 mt-1">Avg Mood /10</div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 text-center">
            <div className="text-3xl font-mono font-bold text-amber-400">{avgEnergy}</div>
            <div className="text-2xs text-slate-500 mt-1">Avg Energy /10</div>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Mood & Energy Over Time</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="mood" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 3, fill: '#2dd4bf' }} name="Mood" />
                <Line type="monotone" dataKey="energy" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} name="Energy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Log Check-in */}
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="Heart" size={15} className="text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Log Check-in</h2>
            </div>
            {patients.length > 0 && (
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
                className="w-full bg-slate-800/40 border border-slate-800/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
                <option value="">-- Patient (optional) --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-2">How are you feeling?</p>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map(m => <MoodTag key={m} mood={m} selected={mood === m} onClick={() => setMood(m)} />)}
              </div>
            </div>
            <ScoreSlider label="Mood Score" value={moodScore} onChange={setMoodScore} color="text-teal-400" />
            <ScoreSlider label="Energy Score" value={energyScore} onChange={setEnergyScore} color="text-violet-400" />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes… (optional)"
              rows={3} className="w-full bg-slate-800/40 border border-slate-800/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/40 resize-none" />
            <button onClick={submitCheckin} className="w-full bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-sm font-medium py-2.5 rounded-lg transition-colors">
              Submit Check-in
            </button>
          </div>

          {/* History */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white px-1">Recent Check-ins</h2>
            {checkins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600 gap-2">
                <Icon name="Heart" size={24} className="opacity-20" />
                <p className="text-xs">No check-ins logged yet</p>
              </div>
            ) : checkins.slice(0, 8).map(c => (
              <div key={c.id} className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white capitalize">{c.mood}</span>
                  <span className="text-2xs text-slate-600 font-mono">{new Date(c.ts).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs font-mono text-teal-400">{c.moodScore}/10</div>
                    <div className="text-2xs text-slate-600">mood</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-violet-400">{c.energyScore}/10</div>
                    <div className="text-2xs text-slate-600">energy</div>
                  </div>
                </div>
                {c.notes && <p className="text-2xs text-slate-500 mt-1.5">{c.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
