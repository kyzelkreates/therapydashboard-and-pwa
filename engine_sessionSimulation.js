/**
 * ============================================================
 * AP3X Therapy Session Simulation Engine
 * Generates realistic demo sessions, patients, events, and summaries
 * SIMULATION ONLY - no real patient data
 * ============================================================
 */

// ─── Patient States ────────────────────────────────────────────
export const PATIENT_STATES = {
  CALM:       'calm',
  NEUTRAL:    'neutral',
  STRESSED:   'stressed',
  REFLECTIVE: 'reflective',
  IMPROVED:   'improved',
}

export const PATIENT_STATE_CONFIG = {
  calm:       { label: 'Calm',       color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    icon: 'Waves'        },
  neutral:    { label: 'Neutral',    color: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   icon: 'Minus'        },
  stressed:   { label: 'Stressed',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'AlertCircle'  },
  reflective: { label: 'Reflective', color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: 'Lightbulb'    },
  improved:   { label: 'Improved',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'TrendingUp'   },
}

// ─── Session Phases ────────────────────────────────────────────
export const SESSION_PHASES = {
  CHECK_IN:   'check_in',
  REFLECTION: 'reflection',
  GUIDED:     'guided',
  SUMMARY:    'summary',
  COMPLETE:   'complete',
}

// ─── Session Events ────────────────────────────────────────────
export const SESSION_EVENTS = {
  SESSION_STARTED:      'session_started',
  CHECKIN_COMPLETED:    'checkin_completed',
  REFLECTION_SUBMITTED: 'reflection_submitted',
  AI_PROMPT_DELIVERED:  'ai_prompt_delivered',
  SUMMARY_GENERATED:    'summary_generated',
  SESSION_COMPLETED:    'session_completed',
}

// ─── Demo Patients ─────────────────────────────────────────────
const DEMO_PATIENTS = [
  { id: 'p001', name: 'Alex Morgan',   initials: 'AM', age: 34, sessions: 12, state: PATIENT_STATES.REFLECTIVE, lastSession: '2026-05-28', tags: ['anxiety', 'work-stress']     },
  { id: 'p002', name: 'Jamie Chen',    initials: 'JC', age: 28, sessions: 7,  state: PATIENT_STATES.IMPROVED,   lastSession: '2026-05-27', tags: ['depression', 'sleep']        },
  { id: 'p003', name: 'Sam Rivera',    initials: 'SR', age: 41, sessions: 20, state: PATIENT_STATES.CALM,       lastSession: '2026-05-26', tags: ['grief', 'transitions']       },
  { id: 'p004', name: 'Jordan Blake',  initials: 'JB', age: 23, sessions: 4,  state: PATIENT_STATES.STRESSED,   lastSession: '2026-05-25', tags: ['trauma', 'self-esteem']      },
  { id: 'p005', name: 'Taylor Quinn',  initials: 'TQ', age: 37, sessions: 15, state: PATIENT_STATES.NEUTRAL,    lastSession: '2026-05-22', tags: ['relationships', 'identity']  },
  { id: 'p006', name: 'Casey Davis',   initials: 'CD', age: 30, sessions: 9,  state: PATIENT_STATES.CALM,       lastSession: '2026-05-20', tags: ['burnout', 'boundaries']      },
]

// ─── Guided Reflection Prompts ─────────────────────────────────
const REFLECTION_PROMPTS = [
  "What stood out to you most from the past week?",
  "On a scale of 1-10, how would you describe your energy levels today?",
  "Is there a specific moment you'd like to explore in this session?",
  "What has felt most challenging recently?",
  "What small thing brought you comfort or peace this week?",
  "How has your sleep been lately?",
  "Is there anything you've been avoiding thinking about?",
  "What would a good day look like for you right now?",
  "How do you feel sitting here today, compared to last session?",
  "What's one thing you're proud of since we last met?",
]

// ─── AI Support Prompts ────────────────────────────────────────
const AI_SUPPORT_PROMPTS = [
  "That sounds like it took a lot of courage to acknowledge. Would you like to explore that feeling further?",
  "It's natural to feel that way. Let's take a moment to sit with it together.",
  "You've described something quite significant. What feels most true about that for you?",
  "I notice you mentioned that theme. How long has that been present for you?",
  "What do you think you need most right now?",
  "Let's try a brief grounding reflection: name three things you can notice around you.",
  "You've shown real insight in recognising that pattern. What might a small step forward look like?",
  "How does your body feel when you think about that?",
  "What would you say to a friend who was feeling the same way?",
  "Is there anything left unsaid that might be important to voice today?",
]

// ─── Session Summary Templates ─────────────────────────────────
const SUMMARY_TEMPLATES = [
  (name, state) => `${name} engaged thoughtfully in today's session. Mood at check-in indicated a ${state} state. Reflection prompted meaningful exploration of recent patterns. Prompts were well-received. Session completed as planned.`,
  (name, state) => `Today's session with ${name} followed the structured flow. The patient presented in a ${state} state. Guided reflection generated several key insights. The AI prompt layer supported structured thinking. Good session engagement overall.`,
  (name, state) => `${name} arrived presenting as ${state}. The session moved through all phases -- check-in, reflection, guided prompts, and summary. Observations noted for review. Patient appeared more settled by session close.`,
]

// ─── Next Step Suggestions ─────────────────────────────────────
const NEXT_STEPS = {
  calm:       "Consider scheduling your next check-in in a week. Maintaining your current routines and self-care practices will support continued wellbeing.",
  neutral:    "A short mindfulness or breathing exercise before your next session can help you arrive more centred. Note anything that shifts your mood between now and then.",
  stressed:   "Try a brief grounding exercise today -- five slow breaths, then identify one small thing you can control. Be gentle with yourself.",
  reflective: "The insights from today are worth sitting with. Consider journaling your thoughts before your next session to capture any further reflections.",
  improved:   "Wonderful progress. Acknowledge what has contributed to this improvement and consider how to protect those conditions going forward.",
}

// ─── Session Generator ─────────────────────────────────────────
export const sessionSimulation = {

  getDemoPatients() {
    return DEMO_PATIENTS.map(p => ({ ...p }))
  },

  getReflectionPrompt() {
    return REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]
  },

  generateAIPrompt() {
    const content = AI_SUPPORT_PROMPTS[Math.floor(Math.random() * AI_SUPPORT_PROMPTS.length)]
    return { id: 'prompt_' + Date.now(), content, ts: new Date().toISOString() }
  },

  generateSummary(name, state) {
    const tmpl = SUMMARY_TEMPLATES[Math.floor(Math.random() * SUMMARY_TEMPLATES.length)]
    return tmpl(name, state || 'neutral')
  },

  generateCheckin(patientId, overrides = {}) {
    const moods = ["great", "okay", "low", "anxious", "tired", "hopeful", "overwhelmed", "calm"]
    const mood  = overrides.mood || moods[Math.floor(Math.random() * moods.length)]
    return {
      id:          'chk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      patientId,
      ts:          new Date().toISOString(),
      mood,
      moodScore:   overrides.moodScore   ?? Math.floor(Math.random() * 5) + 5,
      energyScore: overrides.energyScore ?? Math.floor(Math.random() * 5) + 4,
      notes:       '',
    }
  },

  generateSession(patientId, patientName, overrides = {}) {
    const states = Object.values(PATIENT_STATES)
    const state  = overrides.state || states[Math.floor(Math.random() * states.length)]
    const now    = new Date()
    return {
      id:          'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      patientId,
      patientName,
      phase:       SESSION_PHASES.CHECK_IN,
      state,
      startedAt:   now.toISOString(),
      completedAt: null,
      checkIn:     null,
      reflection:  null,
      aiPrompts:   [],
      summary:     null,
      moodScore:   null,
      energyScore: null,
      events:      [],
      ...overrides,
    }
  },

  generateDemoSessionHistory(patientId, patientName, count = 5) {
    return Array.from({ length: count }, (_, i) => {
      const daysAgo = (i + 1) * 7
      const d       = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      const states  = Object.values(PATIENT_STATES)
      const state   = states[Math.floor(Math.random() * states.length)]
      const checkin = this.generateCheckin(patientId)
      checkin.ts    = d.toISOString()
      const session = {
        id:          'sess_' + d.getTime() + '_' + i,
        patientId,
        patientName,
        phase:       SESSION_PHASES.COMPLETE,
        state,
        startedAt:   d.toISOString(),
        completedAt: new Date(d.getTime() + 45 * 60 * 1000).toISOString(),
        checkIn:     checkin,
        reflection:  { prompt: this.getReflectionPrompt(), response: 'Simulated reflection response.' },
        aiPrompts:   [this.generateAIPrompt()],
        summary:     this.generateSummary(patientName, state),
        moodScore:   checkin.moodScore,
        energyScore: checkin.energyScore,
        events:      [],
      }
      return session
    })
  },

  buildEventStream(session) {
    const base = new Date(session.startedAt).getTime()
    return [
      { ts: base,            label: 'Session started',       type: SESSION_EVENTS.SESSION_STARTED      },
      { ts: base + 3 * 60e3, label: 'Check-in completed',    type: SESSION_EVENTS.CHECKIN_COMPLETED    },
      { ts: base + 8 * 60e3, label: 'Reflection submitted',  type: SESSION_EVENTS.REFLECTION_SUBMITTED },
      { ts: base + 18 * 60e3,label: 'AI prompt delivered',   type: SESSION_EVENTS.AI_PROMPT_DELIVERED  },
      { ts: base + 38 * 60e3,label: 'Summary generated',     type: SESSION_EVENTS.SUMMARY_GENERATED    },
      { ts: base + 42 * 60e3,label: 'Session completed',     type: SESSION_EVENTS.SESSION_COMPLETED    },
    ]
  },
}

export default sessionSimulation
