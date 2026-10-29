import { useEffect, useState } from 'react'

const KEY = 'rag_theme'

export type Theme = 'dark' | 'light'

export function bootTheme() {
  if (typeof document === 'undefined') return
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'light' || stored === 'dark') applyTheme(stored)
  } catch {
    /* private mode */
  }
}

export function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
  localStorage.setItem(KEY, theme)
}

type ThemeToggleProps = {
  sidebarMode?: boolean
  collapsed?: boolean
}

export function ThemeToggle({ sidebarMode, collapsed }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    setTheme(readTheme())
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  const icon = theme === 'dark' ? '☀' : '☾'
  const nextLabel = theme === 'dark' ? 'Light mode' : 'Dark mode'

  if (sidebarMode) {
    return (
      <button
        type="button"
        className="theme-toggle"
        onClick={toggle}
        aria-label={`Switch to ${nextLabel}`}
        title={collapsed ? nextLabel : undefined}
      >
        <span className="theme-toggle-icon" aria-hidden>{icon}</span>
        <span className="theme-toggle-label">{nextLabel}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${nextLabel}`}
    >
      <span className="theme-toggle-icon" aria-hidden>{icon}</span>
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
