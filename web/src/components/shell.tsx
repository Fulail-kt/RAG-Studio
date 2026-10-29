import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { ThemeToggle } from '#/components/theme'
import { clearSession, getEmail } from '#/lib/session'

type ShellProps = {
  children: React.ReactNode
  flush?: boolean
}

const NAV = [
  {
    to: '/dashboard' as const,
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="7" height="7" rx="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/agent' as const,
    label: 'Agent',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2a4 4 0 0 1 4 4v1h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v1a4 4 0 0 1-8 0v-1H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V6a4 4 0 0 1 4-4Z" />
        <circle cx="8" cy="9" r="0.8" fill="currentColor" />
        <circle cx="12" cy="9" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/kb' as const,
    label: 'Knowledge',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M8 4V2" /><path d="M12 4V2" />
        <path d="M5 8h6" /><path d="M5 11h6" /><path d="M5 14h4" />
        <path d="M16 6h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3" />
      </svg>
    ),
  },
  {
    to: '/play' as const,
    label: 'Playground',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13a2 2 0 0 1-2 2H6l-4 3V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8Z" />
        <circle cx="7" cy="9" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="10" cy="9" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="13" cy="9" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

export function Shell({ children, flush }: ShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const email = getEmail()

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === '1' } catch { return false }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('sidebar-collapsed', next ? '1' : '0') } catch {}
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const initial = (email ?? 'U').slice(0, 1).toUpperCase()

  const sidebarCls = [
    'sidebar',
    collapsed ? 'sidebar--collapsed' : '',
    mobileOpen ? 'sidebar--open' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarCls}>
        <div className="sidebar-brand">
          <Link to="/dashboard" className="sidebar-brand-link">
            <span className="brand-mark">
              <svg viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="4" r="2" fill="white" />
                <circle cx="3" cy="10.5" r="1.5" fill="white" opacity="0.75" />
                <circle cx="11" cy="10.5" r="1.5" fill="white" opacity="0.75" />
                <line x1="7" y1="6" x2="3.5" y2="9.2" stroke="white" strokeWidth="1.2" opacity="0.6" />
                <line x1="7" y1="6" x2="10.5" y2="9.2" stroke="white" strokeWidth="1.2" opacity="0.6" />
              </svg>
            </span>
            <span className="sidebar-brand-name">RAG Studio</span>
          </Link>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 3l5 5-5 5" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-item${active ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                <span className="sidebar-item-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle sidebarMode collapsed={collapsed} />
          <div className="sidebar-divider" />
          <div className="sidebar-user" title={email ?? undefined}>
            <span className="sidebar-avatar">{initial}</span>
            <span className="sidebar-email">{email}</span>
          </div>
          <button
            type="button"
            className={`sidebar-item${collapsed ? ' ' : ''}`}
            style={{ background: 'transparent', border: 'none', width: '100%' }}
            onClick={() => { clearSession(); void navigate({ to: '/login' }) }}
            title="Log out"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.1rem', height: '1.1rem', flexShrink: 0 }}>
              <path d="M13 15l4-5-4-5" />
              <path d="M17 10H7" />
              <path d="M7 19H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3" />
            </svg>
            <span className="sidebar-item-label">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className={`main-area${flush ? ' main-area--flush' : ' main-area--scroll'}`}>
        {/* Mobile top bar */}
        <div className="mobile-header">
          <button
            type="button"
            className="mobile-header-toggle ghost"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <span className="brand-mark" style={{ width: '1.6rem', height: '1.6rem' }}>
            <svg viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="7" cy="4" r="2" fill="white" />
              <circle cx="3" cy="10.5" r="1.5" fill="white" opacity="0.75" />
              <circle cx="11" cy="10.5" r="1.5" fill="white" opacity="0.75" />
              <line x1="7" y1="6" x2="3.5" y2="9.2" stroke="white" strokeWidth="1.2" opacity="0.6" />
              <line x1="7" y1="6" x2="10.5" y2="9.2" stroke="white" strokeWidth="1.2" opacity="0.6" />
            </svg>
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.03em' }}>RAG Studio</span>
        </div>

        {flush ? (
          children
        ) : (
          <div className="main-content">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
