/**
 * ============================================================
 * AP3X Reflection Assistant Engine
 * Structured reflection prompts and local AI fallback
 * NON-MEDICAL: reflection and thinking support only
 * ============================================================
 */

export const PROMPT_CATEGORIES = {
  OPENING:   'opening',
  EMOTIONAL: 'emotional',
  COGNITIVE: 'cognitive',
  GROUNDING: 'grounding',
  CLOSING:   'closing',
}

const PROMPT_BANK = {
  [PROMPT_CATEGORIES.OPENING]: [
    "How are you feeling as we begin today's session?",
    "What's been on your mind since we last met?",
    "What would you most like to focus on today?",
    "How has your week been, overall?",
    "What brought you here today?",
  ],
  [PROMPT_CATEGORIES.EMOTIONAL]: [
    "Can you describe what that feeling is like in your body?",
    "Where do you think that emotion is coming from?",
    "What does that feeling remind you of?",
    "How long have you been carrying that feeling?",
    "What would it feel like to put that feeling down for a moment?",
  ],
  [PROMPT_CATEGORIES.COGNITIVE]: [
    "What thoughts come up when you think about that situation?",
    "If a friend were in this situation, what would you tell them?",
    "What do you think is the story you're telling yourself here?",
    "Is there another way to look at this?",
    "What would need to be true for things to feel different?",
  ],
  [PROMPT_CATEGORIES.GROUNDING]: [
    "Let's take a slow breath together. What do you notice right now?",
    "What are three things you can see around you?",
    "What is one thing that feels stable or safe right now?",
    "What does it feel like to simply sit here in this moment?",
    "Can you notice the ground beneath you? What does that feel like?",
  ],
  [PROMPT_CATEGORIES.CLOSING]: [
    "What is one thing you want to carry forward from today?",
    "How do you feel now compared to when we started?",
    "What small step could you take before our next session?",
    "What are you proud of yourself for today?",
    "What would feel like a kind thing to do for yourself this week?",
  ],
}

// ─── Local fallback responses ──────────────────────────────────
const LOCAL_RESPONSES = [
  "Thank you for sharing that. It takes courage to explore these feelings. What comes up for you when you sit with that?",
  "That sounds really significant. Would you like to explore what that means for you a little further?",
  "I hear you. It's natural to feel that way. What do you think you need most right now?",
  "That's a really important observation. What do you think is beneath that feeling?",
  "You're showing a lot of insight by noticing that. How long have you been aware of this pattern?",
  "Thank you for trusting me with that. What feels most true about what you just shared?",
  "That sounds like a heavy thing to carry. What would it feel like to let yourself rest from it for a moment?",
  "I notice you used the word 'always' -- is that how it feels, or are there exceptions you can think of?",
  "What would a compassionate response to yourself look like right now?",
  "You've shown real awareness in recognising that. What might a small step forward look like?",
]

// ─── Next step suggestions ─────────────────────────────────────
const NEXT_STEPS = {
  calm:       "Consider scheduling your next check-in in a week. Maintaining your current routines and self-care practices will support continued wellbeing.",
  neutral:    "A short mindfulness or breathing exercise before your next session can help you arrive more centred. Note anything that shifts your mood between now and then.",
  stressed:   "Try a brief grounding exercise today -- five slow breaths, then identify one small thing you can control. Be gentle with yourself.",
  reflective: "The insights from today are worth sitting with. Consider journaling your thoughts before your next session to capture any further reflections.",
  improved:   "Wonderful progress. Acknowledge what has contributed to this improvement and consider how to protect those conditions going forward.",
}

// ─── Reflection Assistant ──────────────────────────────────────
export const reflectionAssistant = {
  PROMPT_BANK,

  getPrompt(category) {
    const bank = PROMPT_BANK[category] || PROMPT_BANK[PROMPT_CATEGORIES.OPENING]
    return bank[Math.floor(Math.random() * bank.length)]
  },

  getNextStep(state) {
    return NEXT_STEPS[state] || NEXT_STEPS.neutral
  },

  async generateResponse(userMessage, history = []) {
    // Try configured AI provider
    try {
      const provider  = localStorage.getItem('ap3x:ai:provider')
      const apiKey    = provider ? localStorage.getItem('ap3x:ai:key:' + provider) : null

      if (apiKey && provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: "You are AP3X, a compassionate session reflection and wellbeing support assistant. You guide structured thinking and reflection ONLY. You do NOT provide medical advice, diagnosis, or clinical treatment. Keep responses warm, concise (2-3 sentences), and focused on the user's inner experience. Ask one gentle follow-up question per response.",
              },
              ...history.slice(-8),
              { role: 'user', content: userMessage },
            ],
            max_tokens: 200,
            temperature: 0.7,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          return { content: data.choices[0].message.content, source: 'openai' }
        }
      }

      if (apiKey && provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-api-key':         apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 200,
            system: "You are AP3X, a compassionate reflection support assistant. Guide structured thinking only. No medical advice. Warm, concise 2-3 sentence responses with one gentle follow-up question.",
            messages: [
              ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: userMessage },
            ],
          }),
        })
        if (res.ok) {
          const data = await res.json()
          return { content: data.content[0].text, source: 'anthropic' }
        }
      }
    } catch (e) {
      // Fall through to local
    }

    // Local fallback
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400))
    const response = LOCAL_RESPONSES[Math.floor(Math.random() * LOCAL_RESPONSES.length)]
    return { content: response, source: 'local' }
  },
}

export default reflectionAssistant
