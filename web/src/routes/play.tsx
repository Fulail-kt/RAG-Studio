import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import Markdown from 'react-markdown'

import { Shell } from '#/components/shell'
import { streamChat } from '#/lib/api'
import { getToken } from '#/lib/session'
import { api } from '#/lib/api'

export const Route = createFileRoute('/play')({
  ssr: false,
  beforeLoad() {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: PlayPage,
})

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: 'done' | 'loading' | 'streaming' | 'error'
}

const STARTERS = [
  'What can you help me with?',
  'Summarize the key points from your knowledge.',
  'What topics do you know about?',
]

function newId() {
  return crypto.randomUUID()
}

function PlayPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [agentName, setAgentName] = useState('Agent')

  const scrollRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    api<{ agent: { name: string } | null }>('/agents')
      .then((data) => { if (data.agent?.name) setAgentName(data.agent.name) })
      .catch(() => {})
  }, [])

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
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight
    stickRef.current = gap < 80
  }

  function resizeComposer() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  async function send(text: string) {
    const question = text.trim()
    if (!question || pending) return

    setError('')
    setDraft('')
    requestAnimationFrame(resizeComposer)

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
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, status: 'done' } : msg,
        ),
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
      textareaRef.current?.focus()
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    void send(draft)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send(draft)
    }
  }

  const initial = agentName.slice(0, 1).toUpperCase()

  return (
    <Shell flush>
      <div className="chat-page">
        {/* Top bar */}
        <div className="chat-topbar">
          <div className="chat-topbar-avatar">{initial}</div>
          <div>
            <div className="chat-topbar-name">{agentName}</div>
            <div className="chat-topbar-sub">
              {pending ? 'Generating…' : 'Ready'}
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              className="ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setMessages([])}
            >
              New chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
          <div className="chat-inner">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2>{agentName}</h2>
                <p>Your intelligent agent is ready. Ask anything from the knowledge base.</p>
                <div className="suggest-row">
                  {STARTERS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="suggest"
                      disabled={pending}
                      onClick={() => void send(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`msg-row ${msg.role}`}>
                  <div className="msg-avatar" aria-hidden>
                    {msg.role === 'user' ? 'You' : initial}
                  </div>
                  <div className={`msg-bubble${msg.status === 'error' ? ' is-error' : ''}`}>
                    {msg.status === 'loading' ? (
                      <span className="typing" aria-label="Generating response">
                        <span /><span /><span />
                      </span>
                    ) : msg.role === 'assistant' ? (
                      <Markdown>{msg.content || (msg.status === 'error' ? 'Something went wrong.' : '')}</Markdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={anchorRef} aria-hidden />
          </div>
        </div>

        {/* Composer */}
        <div className="chat-composer-wrap">
          {error ? <p className="error chat-err">{error}</p> : null}
          <form className="chat-composer" onSubmit={onSubmit}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                resizeComposer()
              }}
              onKeyDown={onKeyDown}
              placeholder={`Message ${agentName}…`}
              rows={1}
              disabled={pending}
              aria-label="Message"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={pending || !draft.trim()}
              aria-label="Send"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 16V6m-5 4 5-4 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <p className="chat-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </Shell>
  )
}
