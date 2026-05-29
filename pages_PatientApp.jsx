/**
 * ============================================================
 * AP3X PATIENT WELLBEING & SESSION COMPANION PWA
 * Patient-facing mobile interface
 * FLOW: Welcome → Check-in → Reflect → Session → Summary
 *
 * All submissions go through patientSync so the therapist
 * dashboard updates in real-time.
 * ============================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Icon from './components_ui_Icon'
import reflectionAssistant, { PROMPT_CATEGORIES } from './engine_reflectionAssistant'
import { patientSync } from './services_sync_patientSync'

const PHASES = {
  WELCOME:  'welcome',
  IDENTIFY: 'identify',
  CHECK_IN: 'check_in',
  REFLECT:  'reflect',
  SESSION:  'session',
  SUMMARY:  'summary',
}

const MOOD_OPTIONS = [
  { value: 'great',       emoji: '😊', label: 'Great',       score: 9 },
  { value: 'good',        emoji: '🙂', label: 'Good',        score: 7 },
  { value: 'hopeful',     emoji: '🌱', label: 'Hopeful',     score: 6 },
  { value: 'calm',        emoji: '🌊', label: 'Calm',        score: 7 },
  { value: 'okay',        emoji: '😐', label: 'Okay',        score: 5 },
  { value: 'tired',       emoji: '😴', label: 'Tired',       score: 3 },
  { value: 'anxious',     emoji: '😰', label: 'Anxious',     score: 3 },
  { value: 'low',         emoji: '😔', label: 'Low',         score: 3 },
  { value: 'overwhelmed', emoji: '😵', label: 'Overwhelmed', score: 2 },
]

// ─── Disclaimer ───────────────────────────────────────────────
function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem('ap3x:disclaimer') === '1'
  )
  if (dismissed) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            This is a <strong className="text-white">session reflection & wellbeing companion</strong>.
            It is not a medical or clinical tool and does not provide diagnosis or treatment.
          </p>
        </div>
        <button
          onClick={() => { sessionStorage.setItem('ap3x:disclaimer','1'); setDismissed(true) }}
          className="mt-3 w-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium py-2 rounded-xl hover:bg-teal-500/20 transition-colors"
        >
          I understand — Continue
        </button>
      </div>
    </div>
  )
}

// ─── Progress dots ─────────────────────────────────────────────
function ProgressDots({ current }) {
  const steps = [PHASES.CHECK_IN, PHASES.REFLECT, PHASES.SESSION, PHASES.SUMMARY]
  const idx = steps.indexOf(current)
  return (
    <div className="flex items-center gap-2 justify-center">
      {steps.map((s, i) => (
        <div key={s} className={[
          'rounded-full transition-all',
          i < idx   ? 'w-2 h-2 bg-teal-400' :
          i === idx ? 'w-3 h-3 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]' :
                      'w-2 h-2 bg-slate-700'
        ].join(' ')} />
      ))}
    </div>
  )
}

// ─── Welcome ──────────────────────────────────────────────────
function WelcomeScreen({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-8">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-teal-500/10 border-2 border-teal-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(45,212,191,0.15)]">
          <Icon name="Heart" size={36} className="text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Your wellbeing matters. This is a safe space<br />to check in and reflect.
          </p>
        </div>
      </div>
      <button
        onClick={onStart}
        className="w-full max-w-xs bg-teal-500 hover:bg-teal-400 text-black font-bold py-4 rounded-2xl text-base transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)]"
      >
        Begin Session
      </button>
      <p className="text-2xs text-slate-600 max-w-xs leading-relaxed">
        Your responses are shared with your therapist to support your care.
      </p>
    </div>
  )
}

// ─── Identify (link to patient) ───────────────────────────────
function IdentifyScreen({ onContinue }) {
  const patients = patientSync.getAllPatients()
  const [selected, setSelected] = useState('')
  const [name, setName] = useState('')
  const [useManual, setUseManual] = useState(patients.length === 0)

  const handleContinue = () => {
    if (useManual) {
      if (!name.trim()) return
      onContinue({ id: 'anon_' + Date.now(), name: name.trim(), initials: name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) })
    } else {
      const p = patients.find(p => p.id === selected)
      if (!p) return
      onContinue(p)
    }
  }

  return (
    <div className="flex flex-col h-full px-6 py-8 gap-6">
      <div>
        <h2 className="text-xl font-bold text-white">Who are you?</h2>
        <p className="text-slate-400 text-sm mt-1">Select your name so your therapist can see your check-in.</p>
      </div>

      {!useManual && patients.length > 0 && (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {patients.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                selected === p.id
                  ? 'bg-teal-500/10 border-teal-500/30 text-white'
                  : 'bg-slate-800/30 border-slate-800/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center font-bold text-teal-400 text-sm">
                {p.initials}
              </div>
              <span className="font-medium">{p.name}</span>
              {selected === p.id && <Icon name="CheckCircle" size={16} className="ml-auto text-teal-400" />}
            </button>
          ))}
          <button onClick={() => setUseManual(true)} className="w-full text-xs text-slate-500 py-2 hover:text-slate-300 transition-colors">
            My name isn't listed — enter manually
          </button>
        </div>
      )}

      {useManual && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500/40"
          />
          {patients.length > 0 && (
            <button onClick={() => setUseManual(false)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Choose from list
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={useManual ? !name.trim() : !selected}
        className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all"
      >
        Continue
      </button>
    </div>
  )
}

// ─── Check-in ─────────────────────────────────────────────────
function CheckInScreen({ patient, onComplete }) {
  const [mood, setMood]             = useState(null)
  const [moodScore, setMoodScore]   = useState(6)
  const [energy, setEnergy]         = useState(5)
  const [notes, setNotes]           = useState('')

  const handleSubmit = () => {
    const selected = MOOD_OPTIONS.find(m => m.value === mood)
    const score    = selected?.score ?? moodScore
    const checkin  = {
      id:          `chk_${Date.now()}`,
      patientId:   patient.id,
      patientName: patient.name,
      ts:          new Date().toISOString(),
      mood,
      moodScore:   score,
      energyScore: energy,
      notes:       notes.trim(),
    }
    patientSync.submitCheckin(checkin)
    onComplete(checkin)
  }

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-6 overflow-y-auto">
      <div>
        <ProgressDots current={PHASES.CHECK_IN} />
        <h2 className="text-xl font-bold text-white mt-4">How are you feeling?</h2>
        <p className="text-slate-400 text-sm mt-1">Be honest — your therapist wants to know the real you.</p>
      </div>

      {/* Mood picker */}
      <div className="grid grid-cols-3 gap-2">
        {MOOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setMood(opt.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              mood === opt.value
                ? 'bg-teal-500/10 border-teal-500/30 scale-105'
                : 'bg-slate-800/30 border-slate-800/60 hover:border-slate-700'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-2xs text-slate-300">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Energy slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Energy level</span>
          <span className="text-teal-400 font-mono font-bold">{energy}/10</span>
        </div>
        <input type="range" min={1} max={10} value={energy}
          onChange={e => setEnergy(Number(e.target.value))}
          className="w-full accent-teal-400" />
        <div className="flex justify-between text-2xs text-slate-600">
          <span>Exhausted</span><span>Energised</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-slate-400 block mb-1.5">Anything on your mind? (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="A thought, a feeling, something that happened..."
          className="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-teal-500/40"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!mood}
        className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all"
      >
        Submit Check-in
      </button>
    </div>
  )
}

// ─── Reflect ──────────────────────────────────────────────────
function ReflectScreen({ patient, checkin, onComplete }) {
  const prompt   = reflectionAssistant.getPrompt(PROMPT_CATEGORIES.OPENING)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    const reflection = {
      id:          `ref_${Date.now()}`,
      patientId:   patient.id,
      patientName: patient.name,
      ts:          new Date().toISOString(),
      prompt,
      response:    text.trim(),
      text:        text.trim(),
    }
    patientSync.submitReflection(reflection)
    setSubmitted(true)
    setTimeout(() => onComplete(reflection), 800)
  }

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-6">
      <div>
        <ProgressDots current={PHASES.REFLECT} />
        <h2 className="text-xl font-bold text-white mt-4">Reflect</h2>
      </div>

      <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Icon name="Sparkles" size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-200 leading-relaxed italic">{prompt}</p>
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
        placeholder="Take your time. Write as much or as little as you want..."
        className="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-teal-500/40 flex-1"
      />

      <button
        onClick={handleSubmit}
        disabled={!text.trim() || submitted}
        className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all"
      >
        {submitted ? '✓ Saved' : 'Continue'}
      </button>

      <button onClick={() => onComplete(null)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors text-center">
        Skip reflection
      </button>
    </div>
  )
}

// ─── AI Session ───────────────────────────────────────────────
function SessionScreen({ patient, checkin, reflection, onComplete }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId]             = useState(`sess_${Date.now()}`)
  const bottomRef               = useRef(null)

  useEffect(() => {
    const opening = reflectionAssistant.getPrompt(PROMPT_CATEGORIES.OPENING)
    setMessages([{ id: 1, role: 'assistant', content: `Hi ${patient.name.split(' ')[0]}. ${opening}` }])
  }, [patient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const send = useCallback(async (text) => {
    if (!text.trim()) return
    const userMsg = { id: Date.now(), role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const result  = await reflectionAssistant.generateResponse(text.trim(), history)
    setIsTyping(false)
    setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: result.content, source: result.source }])
  }, [messages])

  const finishSession = () => {
    const session = {
      id:          sessionId,
      patientId:   patient.id,
      patientName: patient.name,
      phase:       'complete',
      state:       checkin?.mood || 'neutral',
      startedAt:   new Date(Date.now() - messages.length * 90000).toISOString(),
      completedAt: new Date().toISOString(),
      moodScore:   checkin?.moodScore || 5,
      energyScore: checkin?.energyScore || 5,
      checkIn:     checkin,
      reflection:  reflection,
      aiPrompts:   messages.filter(m => m.role === 'assistant').map(m => ({ content: m.content })),
      summary:     `Session with ${patient.name} — ${messages.length} exchanges.`,
      events:      [],
    }
    patientSync.submitSession(session)
    onComplete(session)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between">
        <div>
          <ProgressDots current={PHASES.SESSION} />
        </div>
        <button
          onClick={finishSession}
          className="text-xs bg-slate-800/60 border border-slate-700/60 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700/60 transition-colors"
        >
          Finish Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-slate-700' : 'bg-violet-500/10 border border-violet-500/20'
            }`}>
              <Icon name={msg.role === 'user' ? 'User' : 'Sparkles'} size={13}
                className={msg.role === 'user' ? 'text-slate-300' : 'text-violet-400'} />
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-teal-500/10 border border-teal-500/15 text-white rounded-tr-sm'
                : 'bg-slate-800/40 border border-slate-800/60 text-slate-200 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Icon name="Sparkles" size={13} className="text-violet-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-800/40 border border-slate-800/60">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-slate-800/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="Type your response..."
            className="flex-1 bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/40"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 bg-teal-500 hover:bg-teal-400 disabled:opacity-30 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
          >
            <Icon name="Send" size={16} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Summary ──────────────────────────────────────────────────
function SummaryScreen({ patient, checkin, session, onReset }) {
  const nextStep = reflectionAssistant.getNextStep(checkin?.mood || 'neutral')

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-5 overflow-y-auto">
      <div className="text-center space-y-3">
        <ProgressDots current={PHASES.SUMMARY} />
        <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/30 rounded-full flex items-center justify-center mx-auto mt-4">
          <Icon name="CheckCircle" size={28} className="text-teal-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Session Complete</h2>
          <p className="text-slate-400 text-sm mt-1">Your therapist has been updated.</p>
        </div>
      </div>

      {checkin && (
        <div className="bg-slate-800/30 border border-slate-800/60 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Today's Check-in</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-teal-400">{checkin.moodScore}/10</div>
              <div className="text-2xs text-slate-500 capitalize">{checkin.mood} mood</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-violet-400">{checkin.energyScore}/10</div>
              <div className="text-2xs text-slate-500">Energy</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Icon name="Lightbulb" size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Before your next session</p>
            <p className="text-sm text-slate-200 leading-relaxed">{nextStep}</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            If you are in crisis or need immediate support, please contact your therapist directly or call a crisis line in your area.
          </p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-slate-800/60 border border-slate-700/60 text-slate-200 font-medium py-3 rounded-2xl hover:bg-slate-700/60 transition-all text-sm"
      >
        Start a New Session
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function PatientApp() {
  const [phase,      setPhase]      = useState(PHASES.WELCOME)
  const [patient,    setPatient]    = useState(null)
  const [checkin,    setCheckin]    = useState(null)
  const [reflection, setReflection] = useState(null)
  const [session,    setSession]    = useState(null)

  const reset = () => {
    setPhase(PHASES.WELCOME)
    setPatient(null); setCheckin(null); setReflection(null); setSession(null)
  }

  return (
    <div className="min-h-screen bg-[#080e1a] flex items-center justify-center p-2">
      <div className="w-full max-w-sm h-[780px] bg-[#0d1426] border border-slate-800/60 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">

        {/* Header */}
        {phase !== PHASES.WELCOME && (
          <div className="px-5 py-4 border-b border-slate-800/40 flex items-center gap-3 flex-shrink-0">
            <div className="w-7 h-7 bg-teal-500/10 border border-teal-500/20 rounded-lg flex items-center justify-center">
              <Icon name="Heart" size={13} className="text-teal-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">AP3X Wellbeing</div>
              {patient && <div className="text-2xs text-slate-500">{patient.name}</div>}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
              <span className="text-2xs text-slate-500">Live</span>
            </div>
          </div>
        )}

        {/* Screens */}
        <div className="flex-1 overflow-hidden">
          {phase === PHASES.WELCOME && (
            <WelcomeScreen onStart={() => setPhase(PHASES.IDENTIFY)} />
          )}
          {phase === PHASES.IDENTIFY && (
            <IdentifyScreen onContinue={p => { setPatient(p); setPhase(PHASES.CHECK_IN) }} />
          )}
          {phase === PHASES.CHECK_IN && (
            <CheckInScreen patient={patient} onComplete={c => { setCheckin(c); setPhase(PHASES.REFLECT) }} />
          )}
          {phase === PHASES.REFLECT && (
            <ReflectScreen patient={patient} checkin={checkin} onComplete={r => { setReflection(r); setPhase(PHASES.SESSION) }} />
          )}
          {phase === PHASES.SESSION && (
            <SessionScreen patient={patient} checkin={checkin} reflection={reflection} onComplete={s => { setSession(s); setPhase(PHASES.SUMMARY) }} />
          )}
          {phase === PHASES.SUMMARY && (
            <SummaryScreen patient={patient} checkin={checkin} session={session} onReset={reset} />
          )}
        </div>
      </div>
      <DisclaimerBanner />
    </div>
  )
}
