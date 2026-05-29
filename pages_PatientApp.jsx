/**
 * ============================================================
 * AP3X PATIENT WELLBEING & SESSION COMPANION PWA
 * Standalone patient-facing mobile interface
 * FLOW: Check-in -> Reflect -> Session -> Summary -> Reset
 * Route: /patient-app  (no auth guard)
 * ============================================================
 */

import { useState, useEffect, useRef } from 'react'
import Icon from './components_ui_Icon'
import sessionSimulation, { PATIENT_STATES, PATIENT_STATE_CONFIG, SESSION_PHASES } from './engine_sessionSimulation'
import reflectionAssistant, { PROMPT_CATEGORIES } from './engine_reflectionAssistant'
import { useCheckinStore, useReflectionStore, useSessionStore, useSimulationStore } from './core_storage'

const PHASES = {
  WELCOME:  'welcome',
  CHECK_IN: 'check_in',
  REFLECT:  'reflect',
  SESSION:  'session',
  SUMMARY:  'summary',
}

const MOOD_OPTIONS = [
  { value: 'great',       emoji: '😊', label: 'Great'       },
  { value: 'good',        emoji: '🙂', label: 'Good'        },
  { value: 'okay',        emoji: '😐', label: 'Okay'        },
  { value: 'low',         emoji: '😔', label: 'Low'         },
  { value: 'anxious',     emoji: '😰', label: 'Anxious'     },
  { value: 'tired',       emoji: '😴', label: 'Tired'       },
  { value: 'hopeful',     emoji: '🌱', label: 'Hopeful'     },
  { value: 'overwhelmed', emoji: '😵', label: 'Overwhelmed' },
  { value: 'calm',        emoji: '🌊', label: 'Calm'        },
]

function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('ap3x:disclaimer') === '1')
  if (dismissed) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            This is a <strong className="text-white">session reflection & wellbeing companion</strong>, not a medical or clinical tool.
            It does not provide diagnosis, treatment, or professional advice.
          </p>
        </div>
        <button onClick={() => { sessionStorage.setItem('ap3x:disclaimer', '1'); setDismissed(true) }}
          className="mt-3 w-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium py-2 rounded-xl hover:bg-teal-500/20 transition-colors">
          I understand - Continue
        </button>
      </div>
    </div>
  )
}

function ProgressDots({ current }) {
  const steps = [PHASES.CHECK_IN, PHASES.REFLECT, PHASES.SESSION, PHASES.SUMMARY]
  const idx = steps.indexOf(current)
  return (
    <div className="flex items-center gap-2 justify-center">
      {steps.map((s, i) => (
        <div key={s} className={[
          'rounded-full transition-all',
          i < idx  ? 'w-2 h-2 bg-teal-400' :
          i === idx ? 'w-3 h-3 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]' :
          'w-2 h-2 bg-slate-700'
        ].join(' ')} />
      ))}
    </div>
  )
}

function WelcomeScreen({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-8">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-teal-500/10 border-2 border-teal-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(45,212,191,0.15)]">
          <Icon name="Heart" size={36} className="text-teal-400" />
        </div>
        <h1 className="text-2xl font-bold text-white leading-tight">AP3X<br />Wellbeing Companion</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
          A structured space for reflection, guided check-ins, and wellbeing support.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        {[
          { icon: 'CheckSquare', color: 'text-teal-400',   label: 'Daily check-in'       },
          { icon: 'BookOpen',    color: 'text-violet-400', label: 'Guided reflection'     },
          { icon: 'Sparkles',    color: 'text-amber-400',  label: 'AI support prompts'    },
          { icon: 'BarChart3',   color: 'text-pink-400',   label: 'Session summary'       },
        ].map(item => (
          <div key={item.label} className="bg-slate-800/30 border border-slate-800/60 rounded-xl p-3 flex items-center gap-3">
            <Icon name={item.icon} size={16} className={item.color + ' flex-shrink-0'} />
            <span className="text-xs text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>
      <button onClick={onStart}
        className="w-full max-w-xs bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 border border-teal-500/30 text-teal-300 font-semibold py-4 rounded-2xl transition-all text-sm shadow-[0_0_20px_rgba(45,212,191,0.1)]">
        Begin Session
      </button>
    </div>
  )
}

function CheckInScreen({ onNext }) {
  const { addCheckin } = useCheckinStore()
  const [mood,        setMood]        = useState(null)
  const [moodScore,   setMoodScore]   = useState(5)
  const [energyScore, setEnergyScore] = useState(5)
  const [notes,       setNotes]       = useState('')

  const submit = () => {
    if (!mood) return
    const checkin = {
      id: 'chk_' + Date.now(),
      patientId: 'self',
      patientName: 'You',
      ts: new Date().toISOString(),
      mood, moodScore, energyScore,
      notes: notes.trim(),
    }
    addCheckin(checkin)
    onNext(checkin)
  }

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-6 overflow-y-auto scrollbar-none">
      <div>
        <p className="text-2xs text-teal-400 uppercase tracking-widest font-semibold mb-1">Step 1 of 4</p>
        <h2 className="text-xl font-bold text-white">Check-in</h2>
        <p className="text-sm text-slate-400 mt-1">How are you feeling right now?</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MOOD_OPTIONS.map(m => (
          <button key={m.value} onClick={() => setMood(m.value)}
            className={[
              'flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-95',
              mood === m.value
                ? 'bg-teal-500/10 border-teal-500/30 text-white'
                : 'bg-slate-800/30 border-slate-800/60 text-slate-400 hover:border-slate-700/60'
            ].join(' ')}>
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-2xs font-medium">{m.label}</span>
          </button>
        ))}
      </div>
      {mood && (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Mood level</span>
              <span className="text-xs font-mono text-teal-400 font-bold">{moodScore}/10</span>
            </div>
            <input type="range" min={1} max={10} value={moodScore}
              onChange={e => setMoodScore(Number(e.target.value))}
              className="w-full accent-teal-400 h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Energy level</span>
              <span className="text-xs font-mono text-violet-400 font-bold">{energyScore}/10</span>
            </div>
            <input type="range" min={1} max={10} value={energyScore}
              onChange={e => setEnergyScore(Number(e.target.value))}
              className="w-full accent-violet-400 h-2" />
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Anything you'd like to note? (optional)"
            rows={3}
            className="w-full bg-slate-800/40 border border-slate-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/40 resize-none" />
        </div>
      )}
      <div className="mt-auto">
        <button onClick={submit} disabled={!mood}
          className="w-full bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 border border-teal-500/30 text-teal-300 font-semibold py-4 rounded-2xl transition-all disabled:opacity-40 text-sm">
          Continue to Reflection
        </button>
      </div>
    </div>
  )
}

function ReflectScreen({ onNext }) {
  const { addReflection } = useReflectionStore()
  const [prompt]    = useState(() => sessionSimulation.getReflectionPrompt())
  const [response,  setResponse]  = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = () => {
    if (!response.trim()) return
    const ref = {
      id: 'ref_' + Date.now(),
      patientId: 'self',
      sessionId: null,
      ts: new Date().toISOString(),
      prompt, response: response.trim(), tags: [],
    }
    addReflection(ref)
    setSubmitted(true)
    setTimeout(() => onNext(ref), 800)
  }

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-6">
      <div>
        <p className="text-2xs text-teal-400 uppercase tracking-widest font-semibold mb-1">Step 2 of 4</p>
        <h2 className="text-xl font-bold text-white">Reflection</h2>
        <p className="text-sm text-slate-400 mt-1">Take a moment to explore your thoughts.</p>
      </div>
      <div className="bg-teal-500/5 border border-teal-500/15 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Icon name="MessageCircle" size={18} className="text-teal-400 flex-shrink-0 mt-0.5" />
          <p className="text-base text-white leading-relaxed italic">"{prompt}"</p>
        </div>
      </div>
      <textarea value={response} onChange={e => setResponse(e.target.value)}
        placeholder="Write freely - there are no right or wrong answers..."
        rows={7}
        className="flex-1 bg-slate-800/40 border border-slate-800/60 rounded-2xl px-4 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/40 resize-none" />
      <div className="mt-auto">
        <button onClick={submit} disabled={!response.trim() || submitted}
          className={[
            'w-full border font-semibold py-4 rounded-2xl transition-all active:scale-95 text-sm',
            submitted
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-teal-500/15 hover:bg-teal-500/25 border-teal-500/30 text-teal-300 disabled:opacity-40'
          ].join(' ')}>
          {submitted ? 'Reflection saved' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}

function SessionScreen({ checkin, reflection, onNext }) {
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [isTyping,  setIsTyping]  = useState(false)
  const [done,      setDone]      = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const opener = "Thanks for completing your check-in. You noted feeling \"" + (checkin && checkin.mood ? checkin.mood : 'okay') + "\" today. " + reflectionAssistant.getPrompt(PROMPT_CATEGORIES.OPENING)
    setMessages([{ id: 0, role: 'assistant', content: opener }])
  }, [])

  useEffect(() => {
    bottomRef.current && bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    const userMsg = { id: Date.now(), role: 'user', content: msg }
    setMessages(m => [...m, userMsg])
    setIsTyping(true)
    await new Promise(r => setTimeout(r, 700 + Math.random() * 900))
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const result  = await reflectionAssistant.generateResponse(msg, history)
    setIsTyping(false)
    setMessages(m => [...m, { id: Date.now() + 1, role: 'assistant', content: result.content }])
  }

  const finish = () => {
    setDone(true)
    setTimeout(() => onNext(messages), 500)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-5 py-4 border-b border-slate-800/60">
        <p className="text-2xs text-teal-400 uppercase tracking-widest font-semibold mb-0.5">Step 3 of 4</p>
        <h2 className="text-base font-bold text-white">Guided Session</h2>
        <p className="text-xs text-slate-500">Explore with your support assistant</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
              m.role === 'user' ? 'bg-slate-700' : 'bg-violet-500/10 border border-violet-500/20'
            ].join(' ')}>
              <Icon name={m.role === 'user' ? 'User' : 'Sparkles'} size={12}
                className={m.role === 'user' ? 'text-slate-300' : 'text-violet-400'} />
            </div>
            <div className={[
              'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
              m.role === 'user'
                ? 'bg-teal-500/10 border border-teal-500/15 text-white rounded-tr-sm'
                : 'bg-slate-800/40 border border-slate-800/60 text-slate-200 rounded-tl-sm'
            ].join(' ')}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="Sparkles" size={12} className="text-violet-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800/40 border border-slate-800/60 flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                  style={{ animationDelay: i * 0.15 + 's' }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 px-4 py-4 border-t border-slate-800/60 space-y-3">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Share your thoughts..."
            className="flex-1 bg-slate-800/40 border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40" />
          <button onClick={() => send()} disabled={!input.trim() || isTyping}
            className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl flex items-center justify-center disabled:opacity-40">
            <Icon name="Send" size={14} />
          </button>
        </div>
        <button onClick={finish} disabled={done}
          className="w-full bg-teal-500/10 hover:bg-teal-500/20 active:scale-95 border border-teal-500/20 text-teal-300 text-sm font-medium py-3 rounded-xl transition-all disabled:opacity-60">
          {done ? 'Generating summary...' : 'Finish Session'}
        </button>
      </div>
    </div>
  )
}

function SummaryScreen({ checkin, reflection, messages, onReset }) {
  const { addSession } = useSessionStore()
  const { addEvent }   = useSimulationStore()
  const [summary,      setSummary] = useState(null)

  useEffect(() => {
    const score = checkin && checkin.moodScore ? checkin.moodScore : 5
    const state = score >= 7 ? PATIENT_STATES.CALM : score >= 5 ? PATIENT_STATES.NEUTRAL : PATIENT_STATES.STRESSED
    const text  = sessionSimulation.generateSummary('You', state)
    setSummary(text)

    const session = {
      id:          'sess_' + Date.now(),
      patientId:   'self',
      patientName: 'You',
      phase:       SESSION_PHASES.COMPLETE,
      state,
      startedAt:   new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      checkIn:     checkin,
      reflection,
      aiPrompts:   messages ? messages.filter(m => m.role === 'assistant').slice(0, 3) : [],
      summary:     text,
      moodScore:   checkin ? checkin.moodScore : null,
      energyScore: checkin ? checkin.energyScore : null,
      events:      [],
    }
    addSession(session)
    sessionSimulation.buildEventStream(session).forEach(e => addEvent(e))
  }, [])

  const nextStep = reflectionAssistant.getNextStep(
    checkin && checkin.moodScore >= 7 ? 'calm' :
    checkin && checkin.moodScore >= 5 ? 'neutral' : 'stressed'
  )

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-5 overflow-y-auto scrollbar-none">
      <div>
        <p className="text-2xs text-teal-400 uppercase tracking-widest font-semibold mb-1">Step 4 of 4</p>
        <h2 className="text-xl font-bold text-white">Session Complete</h2>
        <p className="text-sm text-slate-400 mt-1">Here is a reflection on today's session.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-500/5 border border-teal-500/15 rounded-2xl p-4 text-center">
          <div className="text-3xl font-mono font-bold text-teal-400">{checkin ? checkin.moodScore : '--'}</div>
          <div className="text-2xs text-slate-500 mt-1">Mood /10</div>
        </div>
        <div className="bg-violet-500/5 border border-violet-500/15 rounded-2xl p-4 text-center">
          <div className="text-3xl font-mono font-bold text-violet-400">{checkin ? checkin.energyScore : '--'}</div>
          <div className="text-2xs text-slate-500 mt-1">Energy /10</div>
        </div>
      </div>
      {summary && (
        <div className="bg-slate-800/30 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Sparkles" size={14} className="text-violet-400" />
            <span className="text-xs font-semibold text-slate-300">Session Summary</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
          <p className="text-2xs text-slate-600 mt-3 italic">Reflection summary - not a clinical record</p>
        </div>
      )}
      {reflection && reflection.response && (
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-2xl p-4">
          <p className="text-2xs text-teal-400 italic mb-2">"{reflection.prompt}"</p>
          <p className="text-sm text-slate-300">{reflection.response}</p>
        </div>
      )}
      <div className="bg-teal-500/5 border border-teal-500/15 rounded-2xl p-4 flex items-start gap-3">
        <Icon name="Lightbulb" size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-teal-300 mb-1">Suggested next step</p>
          <p className="text-xs text-slate-400 leading-relaxed">{nextStep}</p>
        </div>
      </div>
      <button onClick={onReset}
        className="mt-auto w-full bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 border border-teal-500/30 text-teal-300 font-semibold py-4 rounded-2xl transition-all text-sm">
        Start New Session
      </button>
    </div>
  )
}

export default function PatientApp() {
  const [phase,           setPhase]           = useState(PHASES.WELCOME)
  const [checkinData,     setCheckinData]     = useState(null)
  const [reflectionData,  setReflectionData]  = useState(null)
  const [sessionMessages, setSessionMessages] = useState([])

  const reset = () => {
    setPhase(PHASES.WELCOME)
    setCheckinData(null)
    setReflectionData(null)
    setSessionMessages([])
  }

  return (
    <div className="min-h-screen bg-[#060d1a] text-white flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="flex-shrink-0 px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center">
            <Icon name="Heart" size={15} className="text-teal-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">AP3X Companion</p>
            <p className="text-2xs text-slate-600">Wellbeing & Session Support</p>
          </div>
        </div>
        {phase !== PHASES.WELCOME && <ProgressDots current={phase} />}
      </div>

      <div className="flex-1 overflow-hidden" style={{ height: 'calc(100dvh - 65px)' }}>
        {phase === PHASES.WELCOME  && <WelcomeScreen onStart={() => setPhase(PHASES.CHECK_IN)} />}
        {phase === PHASES.CHECK_IN && <CheckInScreen onNext={d => { setCheckinData(d); setPhase(PHASES.REFLECT) }} />}
        {phase === PHASES.REFLECT  && <ReflectScreen onNext={d => { setReflectionData(d); setPhase(PHASES.SESSION) }} />}
        {phase === PHASES.SESSION  && (
          <SessionScreen checkin={checkinData} reflection={reflectionData}
            onNext={msgs => { setSessionMessages(msgs); setPhase(PHASES.SUMMARY) }} />
        )}
        {phase === PHASES.SUMMARY && (
          <SummaryScreen checkin={checkinData} reflection={reflectionData} messages={sessionMessages} onReset={reset} />
        )}
      </div>

      <DisclaimerBanner />
    </div>
  )
}
