import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const customStyle = {
  margin: '10px 0',
  borderRadius: '8px',
  fontSize: '13px',
  background: '#0d0d14',
  border: '1px solid #2a2a38',
}

export default function MessageBubble({ role, content, sources }) {
  const isUser = role === 'user'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      animation: 'fadeUp 0.25s ease both',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '6px',
      }}>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          color: 'var(--muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {isUser ? '▸ You' : '◆ Assistant'}
        </span>
      </div>

      <div style={{
        maxWidth: '85%',
        padding: '14px 18px',
        borderRadius: isUser
          ? '16px 4px 16px 16px'
          : '4px 16px 16px 16px',
        background: isUser ? 'var(--user-msg)' : 'var(--bot-msg)',
        border: `1px solid ${isUser ? '#2a2a40' : '#1f1f2e'}`,
        fontSize: '14px',
        lineHeight: '1.7',
      }}>
        {isUser ? (
          <span>{content}</span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    customStyle={customStyle}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code style={{
                    fontFamily: 'var(--mono)',
                    background: '#0d0d14',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--accent)',
                  }} {...props}>
                    {children}
                  </code>
                )
              },
              p({ children }) {
                return <p style={{ marginBottom: '10px' }}>{children}</p>
              },
              ol({ children }) {
                return <ol style={{ paddingLeft: '20px', marginBottom: '10px' }}>{children}</ol>
              },
              ul({ children }) {
                return <ul style={{ paddingLeft: '20px', marginBottom: '10px' }}>{children}</ul>
              },
              li({ children }) {
                return <li style={{ marginBottom: '4px' }}>{children}</li>
              },
              strong({ children }) {
                return <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>{children}</strong>
              },
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>

      {/* Source links */}
      {!isUser && sources && sources.length > 0 && (
        <div style={{
          marginTop: '6px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          maxWidth: '85%',
        }}>
          {sources.map((src, i) => (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                color: 'var(--muted)',
                textDecoration: 'none',
                padding: '2px 8px',
                border: '1px solid var(--border)',
                borderRadius: '99px',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                e.target.style.color = 'var(--accent)'
                e.target.style.borderColor = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.target.style.color = 'var(--muted)'
                e.target.style.borderColor = 'var(--border)'
              }}
            >
              ↗ {new URL(src).hostname}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}