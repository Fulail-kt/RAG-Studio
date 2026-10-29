import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { ThemeToggle } from '#/components/theme'
import { api } from '#/lib/api'
import { getToken } from '#/lib/session'

export const Route = createFileRoute('/register')({
  ssr: false,
  beforeLoad() {
    if (getToken()) throw redirect({ to: '/dashboard' })
  },
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await api('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      await navigate({ to: '/login' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Decorative left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <span className="brand-mark">
              <svg viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="4" r="2" fill="white" />
                <circle cx="3" cy="10.5" r="1.5" fill="white" opacity="0.75" />
                <circle cx="11" cy="10.5" r="1.5" fill="white" opacity="0.75" />
                <line x1="7" y1="6" x2="3.5" y2="9.2" stroke="white" strokeWidth="1.2" opacity="0.6" />
                <line x1="7" y1="6" x2="10.5" y2="9.2" stroke="white" strokeWidth="1.2" opacity="0.6" />
              </svg>
            </span>
            <span className="auth-brand-name">RAG Studio</span>
          </div>
          <h2>Your AI agent, ready in minutes.</h2>
          <p>Configure a system prompt, add knowledge sources, and start chatting — no infrastructure needed.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M8 1L9.9 6H15l-4.1 3 1.6 5L8 11.1 3.5 14l1.6-5L1 6h5.1L8 1Z" />
                </svg>
              </span>
              Free to start — bring your own Gemini key
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3l2 2" />
                </svg>
              </span>
              Responses stream in real time
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M11 7H5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Z" />
                  <path d="M8 3a2 2 0 0 0-2 2v2h4V5a2 2 0 0 0-2-2Z" />
                </svg>
              </span>
              Secure per-user credentials
            </div>
          </div>
        </div>
        <p className="auth-left-footer">Powered by Gemini &amp; LangChain</p>
      </div>

      {/* Form panel */}
      <div className="auth-right">
        <div className="auth-right-top">
          <ThemeToggle />
        </div>

        <div className="auth-right-logo">
          <span className="brand-mark">
            <svg viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="7" cy="4" r="2" fill="white" />
              <circle cx="3" cy="10.5" r="1.5" fill="white" opacity="0.75" />
              <circle cx="11" cy="10.5" r="1.5" fill="white" opacity="0.75" />
              <line x1="7" y1="6" x2="3.5" y2="9.2" stroke="white" strokeWidth="1.2" opacity="0.6" />
              <line x1="7" y1="6" x2="10.5" y2="9.2" stroke="white" strokeWidth="1.2" opacity="0.6" />
            </svg>
          </span>
          <span style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>RAG Studio</span>
        </div>

        <div className="auth-form-head">
          <h1>Create account</h1>
          <p>Get started — it only takes a moment.</p>
        </div>

        <form onSubmit={onSubmit}>
          <label>
            Email address
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="At least 7 characters"
              minLength={7}
              required
              autoComplete="new-password"
            />
          </label>
          {error ? <p className="error" style={{ marginTop: '0.75rem' }}>{error}</p> : null}
          <button type="submit" className="auth-submit" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
