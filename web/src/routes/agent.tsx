import { createFileRoute, redirect } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useEffect, useState } from 'react'

import { ChatPreview } from '#/components/chat-preview'
import { Shell } from '#/components/shell'
import { api } from '#/lib/api'
import { getToken } from '#/lib/session'

type AgentResponse = {
  agent: { name: string; system_prompt: string } | null
}

export const Route = createFileRoute('/agent')({
  ssr: false,
  beforeLoad() {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: AgentPage,
})

function AgentPage() {
  const [name, setName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [savedName, setSavedName] = useState('')
  const [savedPrompt, setSavedPrompt] = useState('')
  const [hasSaved, setHasSaved] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<AgentResponse>('/agents')
      .then((data) => {
        if (!data.agent) return
        setName(data.agent.name)
        setSystemPrompt(data.agent.system_prompt)
        setSavedName(data.agent.name)
        setSavedPrompt(data.agent.system_prompt)
        setHasSaved(true)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load agent'))
      .finally(() => setLoading(false))
  }, [])

  const dirty = name !== savedName || systemPrompt !== savedPrompt
  const chatLive = hasSaved && !dirty && !loading
  const lockReason = !hasSaved
    ? 'Save the agent to unlock the live preview.'
    : 'Unsaved changes — save to refresh the preview.'

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    setPending(true)
    try {
      await api('/agents', {
        method: 'POST',
        body: JSON.stringify({ name, system_prompt: systemPrompt }),
      })
      setSavedName(name)
      setSavedPrompt(systemPrompt)
      setHasSaved(true)
      setPreviewKey((k) => k + 1)
      setNotice('Saved — preview is live.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setPending(false)
    }
  }

  const initial = (name.trim() || 'A').slice(0, 1).toUpperCase()

  return (
    <Shell flush>
      <PanelGroup direction="horizontal" style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Form Panel */}
        <Panel defaultSize={48} minSize={30}>
          <div className="studio-form-panel">
            <div className="profile-hero">
              <span className="profile-avatar">{initial}</span>
              <div>
                <p className="eyebrow">Agent profile</p>
                <h1 style={{ fontSize: '1.35rem' }}>{name.trim() || 'Untitled agent'}</h1>
                <p className="muted">Preview uses the last saved configuration.</p>
              </div>
            </div>

            <div className="profile-form">
              <form onSubmit={onSubmit}>
                <label>
                  Agent name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="my-faq-bot"
                    required
                  />
                </label>
                <label>
                  System prompt
                  <textarea
                    className="prompt-box"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    required
                    placeholder="Describe what this agent does and what it knows. Example: 'If the user asks about the FAQ, open https://example.com/faq and answer from that page.'"
                  />
                </label>

                <div className="profile-meta">
                  <span className={dirty || !hasSaved ? 'pill pill--warn' : 'pill pill--ok'}>
                    {loading ? 'Loading' : dirty || !hasSaved ? 'Unsaved' : 'Saved'}
                  </span>
                  <span className="muted">{systemPrompt.trim().length} chars</span>
                </div>

                {error ? <p className="error" style={{ marginBottom: '0.5rem' }}>{error}</p> : null}
                {notice && !dirty ? <p className="ok" style={{ marginBottom: '0.5rem' }}>{notice}</p> : null}

                <button
                  type="submit"
                  disabled={pending || loading || (!dirty && hasSaved)}
                  style={{ width: '100%' }}
                >
                  {pending ? (
                    <>
                      <svg viewBox="0 0 20 20" fill="none" style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }}>
                        <path d="M10 3a7 7 0 1 0 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Saving…
                    </>
                  ) : hasSaved ? 'Save changes' : 'Save agent'}
                </button>
              </form>
            </div>
          </div>
        </Panel>

        {/* Resize handle */}
        <PanelResizeHandle className="studio-resize-handle" />

        {/* Preview Panel */}
        <Panel minSize={28}>
          <ChatPreview
            key={previewKey}
            enabled={chatLive}
            agentName={savedName || name}
            lockReason={lockReason}
          />
        </Panel>
      </PanelGroup>
    </Shell>
  )
}
