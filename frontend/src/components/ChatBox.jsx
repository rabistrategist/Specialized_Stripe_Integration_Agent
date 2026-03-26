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
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)   // holds AbortController for active stream

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
    // Cleanup on unmount — cancel any active stream
    return () => abortRef.current?.abort()
  }, [])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || streaming) return
    setInput('')

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: msg, sources: [] }])

    // Add empty assistant message that we'll fill token by token
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [], isStreaming: true }])
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, topic }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE lines are separated by \n\n
        const lines = buffer.split('\n\n')
        buffer = lines.pop()   // last item may be incomplete

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = JSON.parse(line.slice(6))   // strip "data: "

          if (payload.startsWith('__SOURCES__')) {
            // Final sentinel — extract sources and mark stream done
            const sources = JSON.parse(payload.replace('__SOURCES__', ''))
            setMessages(prev => {
              const updated = [...prev]
              const last = { ...updated[updated.length - 1] }
              last.sources = sources
              last.isStreaming = false
              updated[updated.length - 1] = last
              return updated
            })
          } else {
            // Regular token — append to last message
            setMessages(prev => {
              const updated = [...prev]
              const last = { ...updated[updated.length - 1] }
              last.content += payload
              updated[updated.length - 1] = last
              return updated
            })
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return   // user closed modal
      setMessages(prev => {
        const updated = [...prev]
        const last = { ...updated[updated.length - 1] }
        last.content = '⚠️ Stream error. Make sure the backend is running on port 8000.'
        last.isStreaming = false
        updated[updated.length - 1] = last
        return updated
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const accentColor = topic === 'stripe' ? 'var(--stripe)' : 'var(--google)'
  const glowColor   = topic === 'stripe' ? 'var(--stripe-glow)' : 'var(--google-glow)'
  const label       = topic === 'stripe' ? 'Stripe' : 'Google Auth'
  const icon        = topic === 'stripe' ? '⚡' : '🔐'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.2s ease',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '760px', height: '85vh',
        background: 'var(--surface)',
        border: `1px solid ${accentColor}44`,
        borderRadius: '20px',
        boxShadow: `0 0 60px ${glowColor}, 0 30px 80px rgba(0,0,0,0.6)`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `${accentColor}22`, border: `1px solid ${accentColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>{icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{label} Integration</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>
                ● official docs only · streaming
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              role={m.role}
              content={m.content}
              sources={m.sources}
              isStreaming={m.isStreaming}
            />
          ))}

          {/* Thinking indicator — shown only before first token arrives */}
          {streaming && messages[messages.length - 1]?.content === '' && (
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
          <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
              >{s}</button>
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
            disabled={streaming}
            style={{
              flex: 1, background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: '10px',
              padding: '12px 16px', color: 'var(--text)',
              fontFamily: 'var(--mono)', fontSize: '13px', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = accentColor }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            style={{
              background: accentColor, color: '#fff', border: 'none',
              borderRadius: '10px', padding: '12px 20px',
              fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '13px',
              cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: streaming || !input.trim() ? 0.5 : 1,
              transition: 'opacity 0.2s',
              boxShadow: `0 0 20px ${glowColor}`,
            }}
          >
            {streaming ? '…' : 'Send ↑'}
          </button>
        </div>
      </div>
    </div>
  )
}