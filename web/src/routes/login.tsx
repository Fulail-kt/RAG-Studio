import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { ThemeToggle } from '#/components/theme'
import { api } from '#/lib/api'
import { getToken, setSession } from '#/lib/session'

export const Route = createFileRoute('/login')({
  ssr: false,
  beforeLoad() {
    if (getToken()) throw redirect({ to: '/dashboard' })
  },
  component: LoginPage,
})

function LoginPage() {
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
      const result = await api<{ token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setSession(result.token, email.trim().toLowerCase())
      await navigate({ to: '/dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
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
          <h2>Build intelligent agents.</h2>
          <p>Connect knowledge, craft prompts, and deploy AI agents that answer from your real data.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M8 2a3 3 0 0 1 3 3v1h1a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 12 11h-1v1a3 3 0 0 1-6 0v-1H4a1.5 1.5 0 0 1-1.5-1.5v-2A1.5 1.5 0 0 1 4 6h1V5a3 3 0 0 1 3-3Z" />
                </svg>
              </span>
              Craft custom AI agent personas
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M3 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                  <path d="M4 6h4M4 9h3" />
                  <path d="M12 5h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7" />
                </svg>
              </span>
              Ingest URLs and custom knowledge
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M14 10a2 2 0 0 1-2 2H5l-3 3V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6Z" />
                </svg>
              </span>
              Stream chat with real-time responses
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
          <h1>Welcome back</h1>
          <p>Sign in to manage your agent and knowledge base.</p>
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
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="error" style={{ marginTop: '0.75rem' }}>{error}</p> : null}
          <button type="submit" className="auth-submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          No account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
