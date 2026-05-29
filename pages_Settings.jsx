/**
 * ============================================================
 * AP3X -- Settings
 * Profile · AI Providers · Security · System
 * ============================================================
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from './components_ui_Icon'
import { useAppStore, useAuthStore, useAIStore } from './core_storage'
import { useAuth } from './hooks_useAuth'
import { AI_PROVIDERS } from './services_ai_aiConfig'

const TABS = [
  { key: 'profile',  label: 'Profile',        icon: 'User'          },
  { key: 'ai',       label: 'AI Providers',    icon: 'Sparkles'      },
  { key: 'system',   label: 'System',          icon: 'Settings'      },
  { key: 'security', label: 'Security',        icon: 'Shield'        },
]

function SectionTitle({ title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-slate-800/40 border border-slate-800/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/40 transition-colors" />
  )
}

// ─── Profile Tab ──────────────────────────────────────────────
function ProfileTab() {
  const { user } = useAuth()
  const [name,  setName]  = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saved, setSaved] = useState(false)

  const save = () => {
    const stored = JSON.parse(localStorage.getItem('apex:auth:user') || '{}')
    localStorage.setItem('apex:auth:user', JSON.stringify({ ...stored, name, email }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="Profile" sub="Your clinician profile information" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name"><TextInput value={name}  onChange={setName}  placeholder="Your name" /></Field>
        <Field label="Email">    <TextInput value={email} onChange={setEmail} placeholder="your@email.com" /></Field>
      </div>
      <div className="p-4 bg-teal-500/5 border border-teal-500/15 rounded-xl">
        <p className="text-xs text-teal-300 font-medium">Role: Clinician / Administrator</p>
        <p className="text-2xs text-slate-500 mt-1">Role-based access is managed at account level.</p>
      </div>
      <button onClick={save}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${saved ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-300'}`}>
        <Icon name={saved ? 'Check' : 'Save'} size={14} />
        {saved ? 'Saved!' : 'Save Profile'}
      </button>
    </div>
  )
}

// ─── AI Providers Tab ─────────────────────────────────────────
function AITab() {
  const { provider, setProvider } = useAIStore()
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved]   = useState(false)

  const providers = [
    { id: 'openai',    label: 'OpenAI (GPT-4)',         icon: 'Zap'      },
    { id: 'anthropic', label: 'Anthropic (Claude)',      icon: 'Brain'    },
    { id: 'local',     label: 'Local Fallback (no API)', icon: 'Server'   },
  ]

  const save = () => {
    if (apiKey) localStorage.setItem(`ap3x:ai:key:${provider}`, apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="AI Provider Configuration" sub="Configure the Support & Reflection Assistant AI backend" />
      <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-3">
        <Icon name="Info" size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300 leading-relaxed">
          The AP3X Support Assistant works in local fallback mode with no API key. Configure a provider for richer, AI-generated responses.
        </p>
      </div>
      <div className="space-y-2">
        {providers.map(p => (
          <button key={p.id} onClick={() => setProvider(p.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${provider === p.id ? 'bg-teal-500/5 border-teal-500/20 text-white' : 'bg-slate-800/20 border-slate-800/60 text-slate-400 hover:text-white hover:border-slate-700/60'}`}>
            <Icon name={p.icon} size={16} className={provider === p.id ? 'text-teal-400' : 'text-slate-600'} />
            <span className="text-sm font-medium">{p.label}</span>
            {provider === p.id && <Icon name="CheckCircle" size={14} className="text-teal-400 ml-auto" />}
          </button>
        ))}
      </div>
      {provider && provider !== 'local' && (
        <Field label={`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key`}>
          <TextInput value={apiKey} onChange={setApiKey} placeholder="sk-…" type="password" />
        </Field>
      )}
      <button onClick={save}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${saved ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-300'}`}>
        <Icon name={saved ? 'Check' : 'Save'} size={14} />
        {saved ? 'Saved!' : 'Save AI Settings'}
      </button>
    </div>
  )
}

// ─── System Tab ───────────────────────────────────────────────
function SystemTab() {
  const { demoMode, toggleDemoMode } = useAppStore()

  const clearAllData = () => {
    if (!window.confirm('Clear all simulation data? This cannot be undone.')) return
    Object.keys(localStorage).filter(k => k.startsWith('ap3x:')).forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="System Settings" sub="Simulation and demo configuration" />
      <div className="flex items-center justify-between p-4 bg-slate-800/20 border border-slate-800/60 rounded-xl">
        <div>
          <p className="text-sm font-medium text-white">Demo Mode</p>
          <p className="text-xs text-slate-500 mt-0.5">Pre-populate with demo patients and sessions</p>
        </div>
        <button onClick={toggleDemoMode}
          className={`relative w-11 h-6 rounded-full transition-colors ${demoMode ? 'bg-teal-500/40' : 'bg-slate-700'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${demoMode ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="p-4 bg-slate-800/20 border border-slate-800/60 rounded-xl space-y-1">
        <p className="text-sm font-medium text-white">System Version</p>
        <p className="text-xs text-teal-400 font-mono">AP3X Patient Support & Therapy Session Dashboard System v2.0.0</p>
        <p className="text-2xs text-slate-600 mt-1">Built on AP3X Intelligence Platform · Simulation Mode</p>
      </div>
      <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
        <p className="text-sm font-semibold text-red-300 mb-2">Danger Zone</p>
        <p className="text-xs text-slate-400 mb-3">Permanently clear all simulation data from local storage.</p>
        <button onClick={clearAllData} className="text-xs text-red-400 border border-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
          Clear All Simulation Data
        </button>
      </div>
    </div>
  )
}

// ─── Security Tab ─────────────────────────────────────────────
function SecurityTab() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  return (
    <div className="space-y-5">
      <SectionTitle title="Security" sub="Account security and session management" />
      <div className="p-4 bg-slate-800/20 border border-slate-800/60 rounded-xl space-y-3">
        <p className="text-sm font-medium text-white">Authentication</p>
        <p className="text-xs text-slate-400">This system uses local authentication. Credentials are stored securely on this device.</p>
      </div>
      <button onClick={() => { logout(); navigate('/auth/login') }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/5 border border-red-500/15 text-red-300 text-sm font-medium hover:bg-red-500/10 transition-colors">
        <Icon name="LogOut" size={14} />Log Out
      </button>
    </div>
  )
}

// ─── Settings Root ────────────────────────────────────────────
export default function Settings() {
  const { section } = useParams()
  const navigate    = useNavigate()
  const [tab, setTab] = useState(section || 'profile')

  const PANELS = { profile: <ProfileTab />, ai: <AITab />, system: <SystemTab />, security: <SecurityTab /> }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-slate-800/60 flex flex-col h-full p-3 gap-1">
        <p className="text-2xs font-semibold text-slate-600 uppercase tracking-wider px-2 py-2">Settings</p>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); navigate(`/settings/${t.key}`) }}
            className={clsx('flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left',
              tab === t.key ? 'bg-slate-800/80 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40')}>
            <Icon name={t.icon} size={15} className={tab === t.key ? 'text-teal-400' : 'text-slate-600'} />
            {t.label}
          </button>
        ))}
      </div>
      {/* Panel */}
      <div className="flex-1 overflow-y-auto p-8">
        {PANELS[tab] || <ProfileTab />}
      </div>
    </div>
  )
}

function clsx(...args) { return args.filter(Boolean).join(' ') }
