import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Shell } from '#/components/shell'
import { api } from '#/lib/api'
import { getToken } from '#/lib/session'

type KbItem = {
  topic: string
  source: string
  scraped_at: string
  chunks: number
  texts: string[]
}

export const Route = createFileRoute('/kb')({
  ssr: false,
  beforeLoad() {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: KnowledgePage,
})

function KnowledgePage() {
  const [items, setItems] = useState<KbItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set())

  const [topic, setTopic] = useState('')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function load() {
    const data = await api<{ items: KbItem[] }>('/kb')
    setItems(data.items)
  }

  useEffect(() => {
    load()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load knowledge'))
      .finally(() => setLoading(false))
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await api('/kb', {
        method: 'POST',
        body: JSON.stringify({ topic, url, text }),
      })
      setTopic('')
      setUrl('')
      setText('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setPending(false)
    }
  }

  function toggleChunks(source: string) {
    setExpandedChunks((prev) => {
      const next = new Set(prev)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return next
    })
  }

  const showEmpty = !loading && items.length === 0

  return (
    <Shell>
      <div className="page-head">
        <p className="eyebrow">Data sources</p>
        <h1>Knowledge Base</h1>
        <p className="muted">Add URLs or pasted text. Prompt-referenced URLs are fetched automatically during chat.</p>
      </div>

      {error ? <p className="error" style={{ marginBottom: '1rem' }}>{error}</p> : null}

      {/* Add Knowledge panel */}
      {(showForm || showEmpty) && (
        <div className="kb-add-panel animate-in">
          <div className="kb-add-panel-head">
            <h2>
              {showEmpty ? (
                <>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: '1rem', height: '1rem', marginRight: '0.4rem', verticalAlign: 'middle', color: 'var(--muted)' }}>
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 5v3l2 2" />
                  </svg>
                  No knowledge added yet
                </>
              ) : 'Add knowledge source'}
            </h2>
            {!showEmpty && (
              <button type="button" className="ghost btn-sm" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            )}
          </div>
          <div className="kb-add-panel-body">
            {showEmpty && (
              <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                Add a URL or paste text below to give your agent contextual knowledge.
              </p>
            )}
            <form onSubmit={onSubmit}>
              <label>
                Topic label
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. product-faq, docs, pricing"
                  required
                />
              </label>
              <label>
                URL <span className="muted" style={{ fontSize: '0.7rem', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/faq"
                  type="url"
                />
              </label>
              <label>
                Text <span className="muted" style={{ fontSize: '0.7rem', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste company notes, documentation, or any text content."
                  style={{ minHeight: '6rem' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                {!showEmpty && (
                  <button type="button" className="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={pending || (!url.trim() && !text.trim())}>
                  {pending ? 'Adding…' : 'Add knowledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toolbar (only when has items and form not open) */}
      {!showForm && !showEmpty && (
        <div className="kb-toolbar">
          <div>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              {items.length} source{items.length !== 1 ? 's' : ''} indexed
            </span>
          </div>
          <button type="button" onClick={() => setShowForm(true)} style={{ gap: '0.4rem' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '0.85rem', height: '0.85rem' }}>
              <path d="M8 3v10M3 8h10" />
            </svg>
            Add knowledge
          </button>
        </div>
      )}

      {/* Knowledge list */}
      {loading ? (
        <p className="muted" style={{ fontSize: '0.875rem' }}>Loading…</p>
      ) : items.length > 0 ? (
        <div className="kb-list">
          {items.map((item) => (
            <div className="kb-item animate-in" key={item.source}>
              <div className="kb-item-header">
                <span className="kb-item-icon">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    {item.source.startsWith('http') ? (
                      <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm-4 6h8M8 2c-1.3 1.7-2 3.7-2 6s.7 4.3 2 6M8 2c1.3 1.7 2 3.7 2 6s-.7 4.3-2 6" />
                    ) : (
                      <><path d="M3 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M4 6h4M4 9h3" /></>
                    )}
                  </svg>
                </span>
                <div className="kb-item-info">
                  <p className="kb-item-topic">{item.topic}</p>
                  <p className="kb-item-meta">
                    {item.source} · {item.chunks} chunk{item.chunks !== 1 ? 's' : ''}
                    {item.scraped_at ? ` · ${item.scraped_at}` : ''}
                  </p>
                </div>
                <span className="pill pill--ok">{item.chunks}</span>
              </div>
              {(item.texts ?? []).length > 0 && (
                <div className="kb-item-chunks">
                  <button
                    type="button"
                    className="kb-chunks-toggle"
                    onClick={() => toggleChunks(item.source)}
                  >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: '0.7rem', height: '0.7rem', transition: 'transform 0.15s', transform: expandedChunks.has(item.source) ? 'rotate(90deg)' : 'none' }}>
                      <path d="M4 2l4 4-4 4" />
                    </svg>
                    {expandedChunks.has(item.source) ? 'Hide' : 'Show'} chunks
                  </button>
                  {expandedChunks.has(item.source) && (
                    <div className="kb-chunks-list">
                      {(item.texts ?? []).map((chunk, index) => (
                        <p className="chunk" key={`${item.source}-${index}`}>{chunk}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  )
}
