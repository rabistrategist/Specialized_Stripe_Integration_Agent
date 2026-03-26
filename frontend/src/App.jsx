import { useState } from 'react'
import './index.css'
import ChatBox from './components/ChatBox'

const globalStyles = `
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
  @keyframes pulse { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }
  @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
  @keyframes gridPan { from { background-position: 0 0 } to { background-position: 40px 40px } }
`

function IntegrationButton({ label, sub, icon, color, glow, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? `${color}18` : 'var(--surface)',
        border: `1px solid ${hovered ? color : 'var(--border)'}`,
        borderRadius: '20px',
        padding: '36px 40px',
        cursor: 'pointer',
        color: 'var(--text)',
        textAlign: 'left',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: hovered ? `0 0 40px ${glow}, 0 20px 40px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'none',
        width: '300px',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.4s',
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: '40px',
        animation: hovered ? 'float 2s ease infinite' : 'none',
      }}>{icon}</div>

      <div>
        <div style={{
          fontFamily: 'var(--sans)',
          fontWeight: 800,
          fontSize: '22px',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
          color: hovered ? color : 'var(--text)',
          transition: 'color 0.3s',
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: '12px',
          color: 'var(--muted)',
          lineHeight: 1.6,
        }}>{sub}</div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontFamily: 'var(--mono)', fontSize: '11px', color: color,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'all 0.3s',
        marginTop: 'auto',
      }}>
        ▸ open chat
      </div>
    </button>
  )
}

export default function App() {
  const [activeTopic, setActiveTopic] = useState(null)

  return (
    <>
      <style>{globalStyles}</style>

      {/* Animated grid background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(to right, #ffffff06 1px, transparent 1px),
          linear-gradient(to bottom, #ffffff06 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        animation: 'gridPan 8s linear infinite',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'var(--accent)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            ◆ RAG-powered · official docs only
          </div>
          <h1 style={{
            fontFamily: 'var(--sans)',
            fontWeight: 800,
            fontSize: 'clamp(36px, 6vw, 64px)',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #e8e8f0 0%, #6b6b80 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Integration<br />Assistant
          </h1>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            color: 'var(--muted)',
            maxWidth: '400px',
            lineHeight: 1.7,
          }}>
            Ask anything about Stripe or Google Auth.<br />
            Answers sourced strictly from official documentation.
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <IntegrationButton
            label="Stripe"
            sub={"Payments · Webhooks\nPayment Element · Test mode"}
            icon="⚡"
            color="var(--stripe)"
            glow="var(--stripe-glow)"
            onClick={() => setActiveTopic('stripe')}
          />
          <IntegrationButton
            label="Google Auth"
            sub={"OAuth2 · Sign-In Button\nWeb Server Flow · Client ID"}
            icon="🔐"
            color="var(--google)"
            glow="var(--google-glow)"
            onClick={() => setActiveTopic('google_auth')}
          />
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '80px',
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          color: 'var(--muted)',
          textAlign: 'center',
          lineHeight: 2,
        }}>
          FastAPI · LangChain · ChromaDB · React<br />
          <span style={{ color: '#ffffff22' }}>
            WebBaseLoader → embed → retrieve → generate
          </span>
        </div>
      </div>

      {activeTopic && (
        <ChatBox
          topic={activeTopic}
          onClose={() => setActiveTopic(null)}
        />
      )}
    </>
  )
}