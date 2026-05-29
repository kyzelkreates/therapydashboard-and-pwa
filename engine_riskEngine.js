/**
 * ============================================================
 * AP3X Risk & Relapse Detection Engine
 * Analyses patient check-in trends, mood patterns, session
 * engagement, and reflection content to flag risk signals.
 *
 * CLINICAL DISCLAIMER: This is a DECISION SUPPORT tool only.
 * All outputs must be reviewed by a qualified clinician.
 * Not a substitute for clinical judgement.
 * ============================================================
 */

// ─── Risk Levels ──────────────────────────────────────────────
export const RISK_LEVELS = {
  NONE:     'none',
  LOW:      'low',
  MODERATE: 'moderate',
  HIGH:     'high',
  CRITICAL: 'critical',
}

export const RISK_CONFIG = {
  none:     { label: 'No Flag',  color: 'text-slate-400',    bg: 'bg-slate-500/10',    border: 'border-slate-500/20',    icon: 'Minus',         pulse: false },
  low:      { label: 'Low',      color: 'text-teal-400',     bg: 'bg-teal-500/10',     border: 'border-teal-500/20',     icon: 'CheckCircle',   pulse: false },
  moderate: { label: 'Moderate', color: 'text-amber-400',    bg: 'bg-amber-500/10',    border: 'border-amber-500/20',    icon: 'AlertTriangle', pulse: false },
  high:     { label: 'High',     color: 'text-orange-400',   bg: 'bg-orange-500/10',   border: 'border-orange-500/20',   icon: 'AlertOctagon',  pulse: true  },
  critical: { label: 'Critical', color: 'text-red-400',      bg: 'bg-red-500/10',      border: 'border-red-500/20',      icon: 'ShieldAlert',   pulse: true  },
}

// ─── Signal Types ─────────────────────────────────────────────
export const SIGNAL_TYPES = {
  MOOD_DECLINE:         'mood_decline',
  MOOD_VOLATILITY:      'mood_volatility',
  ENERGY_DECLINE:       'energy_decline',
  SESSION_MISSED:       'session_missed',
  SESSION_DISENGAGED:   'session_disengaged',
  NEGATIVE_LANGUAGE:    'negative_language',
  HOPELESSNESS:         'hopelessness',
  ISOLATION_LANGUAGE:   'isolation_language',
  RAPID_DECLINE:        'rapid_decline',
  LOW_BASELINE:         'low_baseline',
  CHECKIN_MISSED:       'checkin_missed',
}

// ─── Negative keyword sets (weighted) ─────────────────────────
const HIGH_RISK_WORDS = [
  'hopeless', 'worthless', 'pointless', 'end it', 'give up', 'can\'t go on',
  'no reason', 'disappear', 'nobody cares', 'no point', 'don\'t want to be here',
  'harm', 'hurt myself', 'not worth it', 'nothing matters',
]

const MODERATE_RISK_WORDS = [
  'exhausted', 'numb', 'empty', 'alone', 'isolated', 'trapped', 'stuck',
  'overwhelming', 'can\'t cope', 'too much', 'scared', 'lost', 'broken',
  'can\'t sleep', 'no energy', 'crying', 'withdrawn', 'shutting down',
]

const LOW_RISK_WORDS = [
  'tired', 'anxious', 'worried', 'stressed', 'struggling', 'difficult',
  'hard week', 'bad day', 'not great', 'overwhelmed', 'frustrated',
]

// ─── Mood score map ────────────────────────────────────────────
const MOOD_SCORES = {
  great: 9, good: 7, okay: 5, hopeful: 6, calm: 7,
  low: 3, anxious: 3, tired: 3, overwhelmed: 2,
}

// ─── Core analysis ────────────────────────────────────────────
export const riskEngine = {

  /**
   * analysePatient
   * Returns a full risk assessment for a single patient.
   */
  analysePatient(patient, sessions = [], checkins = [], reflections = []) {
    const now = Date.now()
    const signals = []
    const scores  = []

    // ── Filter to this patient's data ─────────────────────────
    const ptSessions    = sessions.filter(s => s.patientId === patient.id)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    const ptCheckins    = checkins.filter(c => c.patientId === patient.id)
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    const ptReflections = reflections.filter(r => r.patientId === patient.id)
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))

    // ── 1. Mood trend (last 5 check-ins) ──────────────────────
    if (ptCheckins.length >= 2) {
      const recent = ptCheckins.slice(0, 5).map(c => ({
        score: c.moodScore || MOOD_SCORES[c.mood] || 5,
        ts: c.ts
      }))

      const avg = recent.reduce((s, r) => s + r.score, 0) / recent.length

      // Declining trend
      if (recent.length >= 3) {
        const first3Avg = recent.slice(-3).reduce((s, r) => s + r.score, 0) / 3
        const last2Avg  = recent.slice(0, 2).reduce((s, r) => s + r.score, 0) / 2
        if (last2Avg - first3Avg < -2) {
          const severity = last2Avg - first3Avg < -4 ? RISK_LEVELS.HIGH : RISK_LEVELS.MODERATE
          signals.push({
            type:    SIGNAL_TYPES.MOOD_DECLINE,
            level:   severity,
            message: `Mood declining — dropped ${Math.abs((last2Avg - first3Avg).toFixed(1))} points over recent check-ins`,
            ts:      ptCheckins[0].ts,
          })
          scores.push(severity === RISK_LEVELS.HIGH ? 4 : 3)
        }
      }

      // Low baseline
      if (avg < 4) {
        signals.push({
          type:    SIGNAL_TYPES.LOW_BASELINE,
          level:   avg < 3 ? RISK_LEVELS.HIGH : RISK_LEVELS.MODERATE,
          message: `Consistently low mood baseline (avg ${avg.toFixed(1)}/10 over recent check-ins)`,
          ts:      ptCheckins[0].ts,
        })
        scores.push(avg < 3 ? 4 : 3)
      }

      // Volatility (high std dev)
      const mean = avg
      const stdDev = Math.sqrt(recent.reduce((sum, r) => sum + Math.pow(r.score - mean, 2), 0) / recent.length)
      if (stdDev > 2.5 && recent.length >= 3) {
        signals.push({
          type:    SIGNAL_TYPES.MOOD_VOLATILITY,
          level:   RISK_LEVELS.MODERATE,
          message: `High mood volatility detected — significant fluctuations in recent check-ins`,
          ts:      ptCheckins[0].ts,
        })
        scores.push(2)
      }
    }

    // ── 2. Session engagement ─────────────────────────────────
    if (ptSessions.length > 0) {
      const lastSession = new Date(ptSessions[0].startedAt)
      const daysSinceSession = (now - lastSession.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceSession > 21) {
        signals.push({
          type:    SIGNAL_TYPES.SESSION_MISSED,
          level:   daysSinceSession > 35 ? RISK_LEVELS.HIGH : RISK_LEVELS.MODERATE,
          message: `No session in ${Math.round(daysSinceSession)} days`,
          ts:      ptSessions[0].startedAt,
        })
        scores.push(daysSinceSession > 35 ? 4 : 2)
      }

      // Short sessions (disengagement proxy)
      const recentCompleted = ptSessions.filter(s => s.completedAt).slice(0, 3)
      if (recentCompleted.length >= 2) {
        const avgDuration = recentCompleted.reduce((sum, s) => {
          const mins = (new Date(s.completedAt) - new Date(s.startedAt)) / 60000
          return sum + mins
        }, 0) / recentCompleted.length

        if (avgDuration < 10) {
          signals.push({
            type:    SIGNAL_TYPES.SESSION_DISENGAGED,
            level:   RISK_LEVELS.MODERATE,
            message: `Recent sessions averaging ${Math.round(avgDuration)} min — possible disengagement`,
            ts:      recentCompleted[0].startedAt,
          })
          scores.push(2)
        }
      }
    } else if (patient.sessions > 3) {
      // Had sessions before but none in our store — data gap
      signals.push({
        type:    SIGNAL_TYPES.CHECKIN_MISSED,
        level:   RISK_LEVELS.LOW,
        message: 'No recent session data available for analysis',
        ts:      new Date().toISOString(),
      })
      scores.push(1)
    }

    // ── 3. Check-in frequency ─────────────────────────────────
    if (ptCheckins.length > 0) {
      const lastCheckin = new Date(ptCheckins[0].ts)
      const daysSinceCheckin = (now - lastCheckin.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCheckin > 14) {
        signals.push({
          type:    SIGNAL_TYPES.CHECKIN_MISSED,
          level:   RISK_LEVELS.LOW,
          message: `Last check-in was ${Math.round(daysSinceCheckin)} days ago`,
          ts:      ptCheckins[0].ts,
        })
        scores.push(1)
      }
    }

    // ── 4. Language analysis in reflections ───────────────────
    const recentTexts = [
      ...ptCheckins.slice(0, 5).map(c => c.notes || ''),
      ...ptReflections.slice(0, 5).map(r => (r.response || r.text || '')),
    ].join(' ').toLowerCase()

    if (recentTexts.length > 20) {
      const highMatches = HIGH_RISK_WORDS.filter(w => recentTexts.includes(w))
      const modMatches  = MODERATE_RISK_WORDS.filter(w => recentTexts.includes(w))

      if (highMatches.length > 0) {
        signals.push({
          type:    SIGNAL_TYPES.HOPELESSNESS,
          level:   RISK_LEVELS.CRITICAL,
          message: `High-risk language detected in recent reflections. Immediate review recommended.`,
          ts:      new Date().toISOString(),
          matches: highMatches,
        })
        scores.push(5)
      } else if (modMatches.length >= 3) {
        signals.push({
          type:    SIGNAL_TYPES.NEGATIVE_LANGUAGE,
          level:   RISK_LEVELS.MODERATE,
          message: `Multiple risk-associated words in recent reflections (${modMatches.slice(0, 3).join(', ')}…)`,
          ts:      new Date().toISOString(),
        })
        scores.push(2)
      } else if (modMatches.length >= 1) {
        signals.push({
          type:    SIGNAL_TYPES.NEGATIVE_LANGUAGE,
          level:   RISK_LEVELS.LOW,
          message: `Some risk-associated language in recent reflections`,
          ts:      new Date().toISOString(),
        })
        scores.push(1)
      }
    }

    // ── 5. Energy decline ─────────────────────────────────────
    if (ptCheckins.length >= 3) {
      const energies = ptCheckins.slice(0, 5).map(c => c.energyScore || 5)
      const avgEnergy = energies.reduce((s, e) => s + e, 0) / energies.length
      if (avgEnergy < 3.5) {
        signals.push({
          type:    SIGNAL_TYPES.ENERGY_DECLINE,
          level:   RISK_LEVELS.MODERATE,
          message: `Low average energy score (${avgEnergy.toFixed(1)}/10) — possible exhaustion or withdrawal`,
          ts:      ptCheckins[0].ts,
        })
        scores.push(2)
      }
    }

    // ── Compute overall risk level ─────────────────────────────
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0
    const totalScore = scores.reduce((s, v) => s + v, 0)

    let level
    if (maxScore >= 5)           level = RISK_LEVELS.CRITICAL
    else if (maxScore >= 4)      level = RISK_LEVELS.HIGH
    else if (totalScore >= 5 || maxScore >= 3) level = RISK_LEVELS.MODERATE
    else if (totalScore >= 2)    level = RISK_LEVELS.LOW
    else                         level = RISK_LEVELS.NONE

    return {
      patientId:  patient.id,
      patientName: patient.name,
      level,
      signals:    signals.sort((a, b) => {
        const order = { critical: 0, high: 1, moderate: 2, low: 3, none: 4 }
        return order[a.level] - order[b.level]
      }),
      analysedAt: new Date().toISOString(),
      sessionCount: ptSessions.length,
      checkinCount: ptCheckins.length,
    }
  },

  /**
   * analyseAll
   * Runs analysis across all patients. Returns sorted results.
   */
  analyseAll(patients, sessions, checkins, reflections) {
    return patients
      .map(p => this.analysePatient(p, sessions, checkins, reflections))
      .sort((a, b) => {
        const order = { critical: 0, high: 1, moderate: 2, low: 3, none: 4 }
        return order[a.level] - order[b.level]
      })
  },

  /**
   * getPatientRiskSummary — quick label + colour for a patient
   */
  quickLevel(patient, sessions, checkins, reflections) {
    const result = this.analysePatient(patient, sessions, checkins, reflections)
    return result.level
  },
}

export default riskEngine
