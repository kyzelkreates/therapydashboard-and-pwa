/**
 * ============================================================
 * AP3X -- Progress Analytics
 * Non-medical progress indicators and session analytics
 * ============================================================
 */

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import Icon from './components_ui_Icon'
import { useSessionStore, useCheckinStore, usePatientStore } from './core_storage'
import { PATIENT_STATE_CONFIG, SESSION_PHASES } from './engine_sessionSimulation'

const COLORS = ['#2dd4bf', '#a78bfa', '#f59e0b', '#ef4444', '#10b981']

export default function Analytics() {
  const { sessions }  = useSessionStore()
  const { checkins }  = useCheckinStore()
  const { patients }  = usePatientStore()

  // Sessions per week
  const sessionsByWeek = {}
  sessions.forEach(s => {
    const d = new Date(s.startedAt)
    const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('en-GB', { month: 'short' })}`
    sessionsByWeek[week] = (sessionsByWeek[week] || 0) + 1
  })
  const weekData = Object.entries(sessionsByWeek).map(([week, count]) => ({ week, count })).slice(-8)

  // State distribution
  const stateCounts = {}
  patients.forEach(p => { stateCounts[p.state] = (stateCounts[p.state] || 0) + 1 })
  const stateData = Object.entries(stateCounts).map(([state, value]) => ({
    name: PATIENT_STATE_CONFIG[state]?.label || state,
    value,
  }))

  // Mood trend
  const moodTrend = checkins.slice(0, 14).reverse().map((c, i) => ({
    day: new Date(c.ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    mood: c.moodScore,
    energy: c.energyScore,
  }))

  const completedSessions = sessions.filter(s => s.phase === SESSION_PHASES.COMPLETE)
  const avgMood    = completedSessions.filter(s => s.moodScore).length
    ? (completedSessions.filter(s => s.moodScore).reduce((s, c) => s + c.moodScore, 0) / completedSessions.filter(s => s.moodScore).length).toFixed(1)
    : '--'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800/60">
        <h1 className="text-lg font-bold text-white">Progress Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">Simulation data only -- not clinical assessment</p>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Sessions',      value: sessions.length,           color: 'text-teal-400',    bg: 'bg-teal-500/5',    border: 'border-teal-500/15',    icon: 'CalendarCheck' },
            { label: 'Completed Sessions',  value: completedSessions.length,  color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/15', icon: 'CheckCircle'   },
            { label: 'Total Check-ins',     value: checkins.length,           color: 'text-violet-400',  bg: 'bg-violet-500/5',  border: 'border-violet-500/15',  icon: 'Heart'         },
            { label: 'Avg Mood Score',      value: `${avgMood}/10`,           color: 'text-pink-400',    bg: 'bg-pink-500/5',    border: 'border-pink-500/15',    icon: 'TrendingUp'    },
          ].map(k => (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xs text-slate-500 font-semibold tracking-wider uppercase">{k.label}</span>
                <Icon name={k.icon} size={14} className={k.color} />
              </div>
              <div className={`font-mono text-3xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sessions per week */}
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Sessions Over Time</h2>
            {weekData.length < 2 ? (
              <div className="flex items-center justify-center h-32 text-slate-600 text-xs">Not enough data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#2dd4bf" radius={[4, 4, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* State Distribution */}
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Patient State Distribution</h2>
            {stateData.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-600 text-xs">No patient data yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={stateData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {stateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stateData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-slate-300">{d.name}</span>
                      <span className="text-xs font-mono text-slate-500 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mood Trend */}
        {moodTrend.length > 1 && (
          <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Mood & Energy Trend (Check-ins)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={moodTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="mood"   stroke="#2dd4bf" strokeWidth={2} dot={{ r: 3 }} name="Mood" />
                <Line type="monotone" dataKey="energy" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="Energy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className="text-2xs text-slate-700 italic text-center">All data shown is simulation data for session tracking purposes. Not intended for clinical use.</p>
      </div>
    </div>
  )
}
