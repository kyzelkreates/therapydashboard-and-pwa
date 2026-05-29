/**
 * ============================================================
 * AP3X -- Messaging
 * (Preserved from original system -- adapted for therapy context)
 * ============================================================
 */

import { useState } from 'react'
import Icon from './components_ui_Icon'
import { usePatientStore } from './core_storage'

const MOCK_MESSAGES = [
  { id: 1, from: 'System',       text: 'Welcome to AP3X Messaging. Send session reminders and wellbeing check-in prompts to patients.', ts: new Date().toISOString(), type: 'system' },
]

export default function Messaging() {
  const { patients } = usePatientStore()
  const [messages, setMessages]   = useState(MOCK_MESSAGES)
  const [input, setInput]         = useState('')
  const [recipient, setRecipient] = useState('')

  const send = () => {
    if (!input.trim()) return
    setMessages(m => [...m, {
      id:   Date.now(),
      from: 'Clinician',
      to:   recipient || 'All Patients',
      text: input.trim(),
      ts:   new Date().toISOString(),
      type: 'outbound',
    }])
    setInput('')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800/60">
        <h1 className="text-lg font-bold text-white">Messaging</h1>
        <p className="text-xs text-slate-500 mt-0.5">Session reminders and patient communications</p>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-3 ${m.type === 'outbound' ? 'flex-row-reverse' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name={m.type === 'system' ? 'Info' : 'MessageSquare'} size={12} className="text-teal-400" />
            </div>
            <div className={`max-w-lg px-4 py-2.5 rounded-xl text-sm ${m.type === 'outbound' ? 'bg-teal-500/10 border border-teal-500/20 text-white' : 'bg-slate-800/40 border border-slate-800/60 text-slate-300'}`}>
              {m.to && <div className="text-2xs text-slate-500 mb-0.5">To: {m.to}</div>}
              {m.text}
              <div className="text-2xs text-slate-600 mt-1">{new Date(m.ts).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 px-5 py-4 border-t border-slate-800/60">
        <div className="flex gap-3 mb-3">
          <select value={recipient} onChange={e => setRecipient(e.target.value)}
            className="bg-slate-800/40 border border-slate-800/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40">
            <option value="">All Patients</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Type a message or reminder…"
            className="flex-1 bg-slate-800/40 border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/40" />
          <button onClick={send} className="w-10 h-10 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center transition-colors">
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
