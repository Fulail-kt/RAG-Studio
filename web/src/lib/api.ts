import { clearSession, getToken } from '#/lib/session'

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API}${path}`, { ...options, headers })
  if (response.status === 401) {
    clearSession()
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const detail = (data as { detail?: unknown }).detail
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${response.status})`)
  }
  return response
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await request(path, options)
  return response.json() as Promise<T>
}

export async function streamChat(question: string, onChunk: (text: string) => void) {
  const response = await request('/chat', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response stream')

  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.split('\n').find((row) => row.startsWith('data: '))
      if (!line) continue
      const event = JSON.parse(line.slice(6)) as { type: string; content: string }
      if (event.type === 'chunk') onChunk(event.content)
    }
  }
}
