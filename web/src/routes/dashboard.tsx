import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Shell } from '#/components/shell'
import { api } from '#/lib/api'
import { getEmail, getToken } from '#/lib/session'

type AgentResponse = {
  agent: { name: string; system_prompt: string } | null
}

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  beforeLoad() {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: DashboardPage,
})

function DashboardPage() {
  const [agent, setAgent] = useState<{ name: string; system_prompt: string } | null | undefined>(undefined)
  const [error, setError] = useState('')
  const email = getEmail()

  useEffect(() => {
    api<AgentResponse>('/agents')
      .then((data) => setAgent(data.agent ?? null))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load agent')
        setAgent(null)
      })
  }, [])

  const initial = agent ? (agent.name.trim() || 'A').slice(0, 1).toUpperCase() : '?'
  const descSnippet = agent?.system_prompt?.trim().slice(0, 160) ?? ''

  return (
    <Shell>
      <div className="page-head">
        <p className="eyebrow">Workspace</p>
        <h1>Dashboard</h1>
        <p className="muted">Welcome back, {email}</p>
      </div>

      {error ? <p className="error" style={{ marginBottom: '1rem' }}>{error}</p> : null}

      <div className="agent-grid">
        {/* Real agent card */}
        {agent === undefined ? (
          <div className="agent-card" style={{ minHeight: 220 }}>
            <div className="agent-card-header" />
            <div className="agent-card-body" style={{ justifyContent: 'center', alignItems: 'center', paddingTop: '1rem' }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>Loading…</span>
            </div>
          </div>
        ) : agent ? (
          <div className="agent-card animate-in">
            <div className="agent-card-header">
              <div className="agent-card-avatar">{initial}</div>
            </div>
            <div className="agent-card-body">
              <div className="agent-card-info">
                <div className="agent-card-name">{agent.name}</div>
                <span className="agent-card-badge">Active</span>
              </div>
              <p className="agent-card-desc">
                {descSnippet || 'No system prompt configured yet.'}
                {agent.system_prompt.length > 160 ? '…' : ''}
              </p>
              <div className="agent-card-actions">
                <Link to="/agent" className="agent-action">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M11.5 2.5a2.12 2.12 0 0 1 3 3L5 15l-4 1 1-4 9.5-9.5Z" />
                  </svg>
                  Edit
                </Link>
                <Link to="/kb" className="agent-action">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M3 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                    <path d="M4 6h4M4 9h3" />
                    <path d="M11 5h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7" />
                  </svg>
                  Knowledge
                </Link>
                <Link to="/play" className="agent-action primary">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <polygon points="5,3 14,8 5,13" fill="currentColor" stroke="none" />
                  </svg>
                  Playground
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Link to="/agent" className="agent-card-placeholder animate-in">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 4v12M4 10h12" />
            </svg>
            <span>Create your first agent</span>
            <p className="muted" style={{ fontSize: '0.78rem', margin: 0 }}>Configure a persona and system prompt</p>
          </Link>
        )}

        {/* Example / placeholder card */}
        <div className="agent-card" style={{ opacity: 0.5 }}>
          <div className="agent-card-header" style={{ background: 'var(--surface-3)' }}>
            <div className="agent-card-avatar" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>E</div>
          </div>
          <div className="agent-card-body">
            <div className="agent-card-info">
              <div className="agent-card-name">Example Agent</div>
              <span className="pill pill--warn">Example</span>
            </div>
            <p className="agent-card-desc">
              A sample agent that answers questions about your documentation. Add your own system prompt and knowledge to get started.
            </p>
            <div className="agent-card-actions">
              <span className="agent-action" style={{ cursor: 'default', pointerEvents: 'none' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M11.5 2.5a2.12 2.12 0 0 1 3 3L5 15l-4 1 1-4 9.5-9.5Z" />
                </svg>
                Edit
              </span>
              <span className="agent-action" style={{ cursor: 'default', pointerEvents: 'none' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M3 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                  <path d="M4 6h4M4 9h3" />
                  <path d="M11 5h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7" />
                </svg>
                Knowledge
              </span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
