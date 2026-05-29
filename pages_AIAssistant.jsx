/**
 * ============================================================
 * AP3X Support & Reflection Assistant
 * AI-guided reflection and session support
 * STRICT: No diagnosis. No therapy claims. No medical instruction.
 * ============================================================
 */

import { useState, useRef, useEffect } from 'react'
import Icon from './components_ui_Icon'
import { useAIStore } from './core_storage'
import reflectionAssistant, { PROMPT_CATEGORIES } from './engine_reflectionAssistant'

const DISCLAIMER = "AP3X Support Assistant provides structured reflection prompts and guided thinking support only. It does NOT provide medical advice, diagnosis, or clinical treatment. Always consult a qualified professional."

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-slate-700' : 'bg-violet-500/10 border border-violet-500/20'}`}>
        <Icon name={isUser ? 'User' : 'Sparkles'} size={13} className={isUser ? 'text-slate-300' : 'text-violet-400'} />
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-teal-500/10 border border-teal-500/15 text-white rounded-tr-sm'
          : 'bg-slate-800/40 border border-slate-800/60 text-slate-200 rounded-tl-sm'
      }`}>
        {msg.content}
        {msg.source === 'local' && !isUser && (
          <span className="block mt-1 text-2xs text-slate-600">Local fallback — connect AI for full responses</span>
        )}
      </div>
    </div>
  )
}

function PromptSuggestion({ text, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/30 border border-slate-800/60 text-xs text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors">
      {text}
    </button>
  )
}

export default function AIAssistant() {
  const { messages, addMessage, isTyping, setTyping, clearMessages } = useAIStore()
  const [input, setInput] = useState('')
  const [category, setCategory] = useState(PROMPT_CATEGORIES.OPENING)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (messages.length === 0) {
      addMessage({ role: 'assistant', content: "Welcome to the AP3X Support & Reflection Assistant. I'm here to guide you through structured reflection and help you think through what's on your mind. How are you feeling today?" })
    }
  }, [])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    addMessage({ role: 'user', content: msg })
    setTyping(true)
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800))
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const result = await reflectionAssistant.generateResponse(msg, history)
    setTyping(false)
    addMessage({ role: 'assistant', content: result.content, source: result.source })
  }

  const categories = [
    { key: PROMPT_CATEGORIES.OPENING,   label: 'Opening',   icon: 'MessageCircle' },
    { key: PROMPT_CATEGORIES.EMOTIONAL, label: 'Emotional', icon: 'Heart'         },
    { key: PROMPT_CATEGORIES.COGNITIVE, label: 'Thinking',  icon: 'Lightbulb'     },
    { key: PROMPT_CATEGORIES.GROUNDING, label: 'Grounding', icon: 'Waves'         },
    { key: PROMPT_CATEGORIES.CLOSING,   label: 'Closing',   icon: 'CheckCircle'   },
  ]

  const suggestions = reflectionAssistant.PROMPT_BANK[category] || []

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-slate-800/60 flex flex-col h-full bg-slate-900/30">
        <div className="px-4 py-4 border-b border-slate-800/40 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Sparkles" size={15} className="text-violet-400" />
            <span className="text-sm font-semibold text-white">Reflection Prompts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs transition-colors ${category === c.key ? 'bg-violet-500/15 border border-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon name={c.icon} size={9} />{c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-2">
          {suggestions.map((s, i) => (
            <PromptSuggestion key={i} text={s} onClick={() => send(s)} />
          ))}
        </div>
        <div className="px-3 py-3 border-t border-slate-800/40">
          <button onClick={clearMessages} className="w-full text-2xs text-slate-600 hover:text-slate-400 transition-colors py-1">Clear conversation</button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
              <Icon name="Sparkles" size={16} className="text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">AP3X Support & Reflection Assistant</div>
              <div className="text-2xs text-slate-500">Guided reflection · Structured thinking · Wellbeing support</div>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-slate-800/30 border border-slate-800/60 rounded-lg">
            <Icon name="Info" size={12} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-2xs text-slate-500 leading-relaxed">{DISCLAIMER}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none p-5 space-y-4">
          {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Icon name="Sparkles" size={13} className="text-violet-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800/40 border border-slate-800/60 flex items-center gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-800/60">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Share what's on your mind, or choose a prompt from the left..."
              rows={2}
              className="flex-1 bg-slate-800/40 border border-slate-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 resize-none"
            />
            <button onClick={() => send()} disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-10 h-10 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40">
              <Icon name="Send" size={16} />
            </button>
          </div>
          <p className="text-2xs text-slate-700 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
