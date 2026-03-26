import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'

const SUGGESTED = {
  stripe: [
    'How do I accept a payment with Stripe?',
    'Show me how to set up Stripe webhooks',
    'How do I use the Stripe Payment Element?',
  ],
  google_auth: [
    'How do I add Google Sign-In to my React app?',
    'Show me the Google OAuth2 web server flow',
    'How do I get a Google API client ID?',
  ],
}

export default function ChatBox({ topic, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm DocBot, trained exclusively on the official **${topic === 'stripe' ? 'Stripe' : 'Google Auth'}** documentation.\n\nAsk me anything about integration — I'll give you accurate steps and code.`,
      sources: [],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, sources: [] }])
    setLoading(true)

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, topic }),
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Could not reach the backend. Make sure it\'s running on port 8000.', sources: [] },
      ])
    } finally {
      setLoading(false)
    }
  }

  const accentColor = topic === 'stripe' ? 'var(--stripe)' : 'var(--google)'
  const glowColor = topic === 'stripe' ? 'var(--stripe-glow)' : 'var(--google-glow)'
  const label = topic === 'stripe' ? 'Stripe' : 'Google Auth'
  const icon = topic === 'stripe' ? '⚡' : '🔐'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.2s ease',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '760px',
        height: '85vh',
        background: 'var(--surface)',
        border: `1px solid ${accentColor}44`,
        borderRadius: '20px',
        boxShadow: `0 0 60px ${glowColor}, 0 30px 80px rgba(0,0,0,0.6)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: `1px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>{icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{label} Integration</div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: '12px',marginTop:'4px', color: 'var(--muted)',
              }}>
                ● Muhammad Rabi
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: '22px', lineHeight: 1,
            padding: '4px 8px', borderRadius: '8px',
            transition: 'color 0.2s, background 0.2s',
          }}
            onMouseEnter={e => { e.target.style.color = 'var(--text)'; e.target.style.background = 'var(--border)' }}
            onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.background = 'none' }}
          >✕</button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
        }}>
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} sources={m.sources} />
          ))}

          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '13px',
              marginBottom: '16px',
            }}>
              <span style={{ animation: 'pulse 1.2s ease infinite' }}>◆</span>
              searching documentation…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length === 1 && (
          <div style={{
            padding: '0 24px 12px',
            display: 'flex', flexWrap: 'wrap', gap: '8px',
          }}>
            {SUGGESTED[topic].map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{
                fontFamily: 'var(--mono)', fontSize: '11px',
                background: 'var(--surface2)', color: 'var(--muted)',
                border: '1px solid var(--border)', borderRadius: '99px',
                padding: '6px 14px', cursor: 'pointer',
                transition: 'color 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => { e.target.style.color = 'var(--text)'; e.target.style.borderColor = accentColor }}
                onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--border)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface2)',
          display: 'flex', gap: '12px',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Ask about ${label} integration…`}
            disabled={loading}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: `1px solid var(--border)`,
              borderRadius: '10px',
              padding: '12px 16px',
              color: 'var(--text)',
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = accentColor }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              background: accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontFamily: 'var(--sans)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1,
              transition: 'opacity 0.2s, transform 0.1s',
              boxShadow: `0 0 20px ${glowColor}`,
            }}
          >
            Send ↑
          </button>
        </div>
      </div>
    </div>
  )
}