/**
 * ============================================================
 * AP3X THERAPY SUPPORT SYSTEM -- DEMO HUB
 * Standalone demo launch pad
 * Route: /demo  (no auth required)
 * ============================================================
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './components_ui_Icon'
import { usePatientStore, useSessionStore, useAppStore } from './core_storage'
import sessionSimulation from './engine_sessionSimulation'

const SYSTEM_FEATURES = [
  {
    icon: 'LayoutDashboard',
    color: 'text-teal-400',
    bg:    'bg-teal-500/10',
    border: 'border-teal-500/20',
    title: 'Clinician Dashboard',
    desc:  'Full session & care coordination overview with patient cards, session timeline, KPI metrics, and AI insight panel.',
  },
  {
    icon: 'Smartphone',
    color: 'text-violet-400',
    bg:    'bg-violet-500/10',
    border: 'border-violet-500/20',
    title: 'Patient Companion PWA',
    desc:  'Mobile-first patient interface with guided check-in → reflection → AI session → summary flow.',
  },
  {
    icon: 'Sparkles',
    color: 'text-amber-400',
    bg:    'bg-amber-500/10',
    border: 'border-amber-500/20',
    title: 'Support & Reflection Assistant',
    desc:  'AI-guided reflection prompts, structured thinking support, and session summaries. No diagnosis. Support only.',
  },
  {
    icon: 'Activity',
    color: 'text-pink-400',
    bg:    'bg-pink-500/10',
    border: 'border-pink-500/20',
    title: 'Session Simulation Engine',
    desc:  'Generates mock therapy sessions, patient states, and event streams for realistic demo mode.',
  },
  {
    icon: 'BarChart3',
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Progress Analytics',
    desc:  'Non-medical progress indicators -- mood trends, session completion, energy scores, and state distributions.',
  },
  {
    icon: 'Heart',
    color: 'text-rose-400',
    bg:    'bg-rose-500/10',
    border: 'border-rose-500/20',
    title: 'Wellbeing Tracker',
    desc:  'Daily mood and energy logging with visual trend charts and check-in history.',
  },
]

const DISCLAIMER = 'AP3X Patient Support & Therapy Session Dashboard System is a session tracking simulation, wellbeing reflection support, and structured therapy session companion tool. It is NOT a medical diagnosis system, clinical treatment platform, or healthcare authority system. Always consult a qualified professional for medical or clinical needs.'

export default function DemoHub() {
  const navigate = useNavigate()
  const { setPatients } = usePatientStore()
  const { addSession }  = useSessionStore()
  const { toggleDemoMode, demoMode } = useAppStore()
  const [seeded, setSeeded] = useState(false)

  const seedAndLaunch = () => {
    const patients = sessionSimulation.getDemoPatients()
    setPatients(patients)
    patients.forEach(p => {
      const history = sessionSimulation.generateDemoSessionHistory(p.id, p.name, 4)
      history.forEach(s => addSession(s))
    })
    if (!demoMode) toggleDemoMode()
    setSeeded(true)
    setTimeout(() => navigate('/dashboard'), 1200)
  }

  return (
    <div className="min-h-screen bg-[#060d1a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-teal-500/10 border-2 border-teal-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(45,212,191,0.15)]">
              <Icon name="Heart" size={28} className="text-teal-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            AP3X Patient Support &<br />
            <span className="text-teal-400">Therapy Session Dashboard System</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            A structured therapy session companion platform with clinician-style dashboards, patient reflection flows, and AI-assisted session guidance simulation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={seedAndLaunch} disabled={seeded}
              className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 ${seeded ? 'bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-300' : 'bg-teal-500/15 hover:bg-teal-500/25 border-2 border-teal-500/30 text-teal-300'}`}>
              <Icon name={seeded ? 'CheckCircle' : 'Rocket'} size={18} />
              {seeded ? 'Launching Dashboard…' : 'Launch Full Demo (Seed Data)'}
            </button>
            <button onClick={() => navigate('/patient-app')}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-sm bg-violet-500/10 hover:bg-violet-500/20 border-2 border-violet-500/20 text-violet-300 transition-all active:scale-95">
              <Icon name="Smartphone" size={18} />
              Open Patient PWA
            </button>
          </div>
          <p className="text-xs text-slate-600">Or log in to the clinician dashboard directly →{' '}
            <button onClick={() => navigate('/auth/login')} className="text-teal-500 hover:text-teal-400 underline">Login</button>
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto px-6 pb-6">
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 flex items-start gap-3">
          <Icon name="Info" size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/70 leading-relaxed">{DISCLAIMER}</p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <h2 className="text-xl font-bold text-white mb-6 text-center">System Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEM_FEATURES.map(f => (
            <div key={f.title} className={`${f.bg} border ${f.border} rounded-2xl p-5 space-y-3`}>
              <div className={`w-10 h-10 ${f.bg} border ${f.border} rounded-xl flex items-center justify-center`}>
                <Icon name={f.icon} size={20} className={f.color} />
              </div>
              <h3 className="text-sm font-bold text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Architecture */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">System Architecture</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Clinician Dashboard',    sub: 'AP3X Therapy Session & Care Coordination Dashboard', icon: 'Monitor',    color: 'text-teal-400'   },
              { label: 'Patient PWA',            sub: 'AP3X Patient Wellbeing & Session Companion PWA',     icon: 'Smartphone', color: 'text-violet-400' },
              { label: 'AI Layer',               sub: 'AP3X Support & Reflection Assistant',                icon: 'Sparkles',   color: 'text-amber-400'  },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-4 text-center space-y-2">
                <Icon name={s.icon} size={22} className={`${s.color} mx-auto`} />
                <p className="text-xs font-bold text-white">{s.label}</p>
                <p className="text-2xs text-slate-500 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/40">
            <p className="text-xs text-slate-500 text-center">
              Shared state layer: <span className="font-mono text-slate-400">sessions[] · checkins[] · reflections[] · aiMessages[] · patientState[]</span>
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Mode Toggle */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Simulation Mode</p>
            <p className="text-xs text-slate-500 mt-0.5">All data is simulated -- no real patient data is used or stored remotely</p>
          </div>
          <button onClick={toggleDemoMode}
            className={`relative w-12 h-6 rounded-full transition-colors ${demoMode ? 'bg-teal-500/40' : 'bg-slate-700'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${demoMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800/40 py-6 text-center">
        <p className="text-2xs text-slate-700">AP3X Patient Support & Therapy Session Dashboard System · v2.0.0 · Simulation &amp; Reflection Platform</p>
      </div>
    </div>
  )
}
