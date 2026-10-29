import { useCallback, useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'

import { streamChat } from '#/lib/api'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: 'done' | 'loading' | 'streaming' | 'error'
}

type ChatPreviewProps = {
  enabled: boolean
  agentName: string
  lockReason: string
}

function newId() {
  return crypto.randomUUID()
}

export function ChatPreview({ enabled, agentName, lockReason }: ChatPreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!stickRef.current) return
    anchorRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  useEffect(() => {
    scrollToBottom(messages.some((m) => m.status === 'streaming') ? 'auto' : 'smooth')
  }, [messages, scrollToBottom])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64
  }

  async function send(text: string) {
    const question = text.trim()
    if (!question || pending || !enabled) return

    setError('')
    setDraft('')
    const userId = newId()
    const assistantId = newId()
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', content: question, status: 'done' },
      { id: assistantId, role: 'assistant', content: '', status: 'loading' },
    ])
    stickRef.current = true
    setPending(true)

    try {
      await streamChat(question, (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: msg.content + chunk, status: 'streaming' }
              : msg,
          ),
        )
      })
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantId ? { ...msg, status: 'done' } : msg)),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chat failed'
      setError(message)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, content: message, status: 'error' } : msg,
        ),
      )
    } finally {
      setPending(false)
    }
  }

  const label = agentName.trim() || 'Agent'
  const initial = label.slice(0, 1).toUpperCase()

  return (
    <aside className={`preview${enabled ? '' : ' preview--locked'}`}>
      <div className="preview-widget">
        <div className="preview-head">
          <div className="preview-id">
            <span className="preview-dot">{initial}</span>
            <div>
              <strong>{label}</strong>
              <div className="preview-status-row">
                <span className="preview-status-dot" />
                {enabled ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          {enabled && messages.length > 0 && (
            <button
              type="button"
              className="preview-clear-btn"
              onClick={() => setMessages([])}
            >
              Clear
            </button>
          )}
        </div>

        <div className="preview-body">
          <div className="preview-scroll" ref={scrollRef} onScroll={onScroll}>
            {messages.length === 0 ? (
              <p className="preview-empty">
                {enabled
                  ? `Hi! I'm ${label}. Ask me anything.`
                  : 'Save the agent to unlock this preview.'}
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`msg-row ${msg.role}`}>
                  <div className="msg-avatar" aria-hidden>
                    {msg.role === 'user' ? 'You' : initial}
                  </div>
                  <div className={`msg-bubble${msg.status === 'error' ? ' is-error' : ''}`}>
                    {msg.status === 'loading' ? (
                      <span className="typing" aria-label="Thinking">
                        <span /><span /><span />
                      </span>
                    ) : msg.role === 'assistant' ? (
                      <Markdown>{msg.content}</Markdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={anchorRef} aria-hidden />
          </div>

          {!enabled ? (
            <div className="preview-lock">
              <p>{lockReason}</p>
            </div>
          ) : null}

          <div className="preview-composer">
            {error ? <p className="error" style={{ margin: '0 0 0.4rem', fontSize: '0.78rem' }}>{error}</p> : null}
            <form
              className="chat-composer"
              onSubmit={(event) => {
                event.preventDefault()
                void send(draft)
              }}
            >
              <textarea
                ref={textareaRef}
                value={draft}
                rows={1}
                disabled={!enabled || pending}
                placeholder={enabled ? 'Ask something…' : 'Save agent first'}
                aria-label="Preview message"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void send(draft)
                  }
                }}
              />
              <button
                type="submit"
                className="chat-send"
                disabled={!enabled || pending || !draft.trim()}
                aria-label="Send"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M10 16V6m-5 4 5-4 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  )
}
