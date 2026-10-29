const TOKEN = 'rag_token'
const EMAIL = 'rag_email'

export function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(TOKEN) ?? ''
}

export function getEmail() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(EMAIL) ?? ''
}

export function setSession(token: string, email: string) {
  localStorage.setItem(TOKEN, token)
  localStorage.setItem(EMAIL, email)
}

export function clearSession() {
  localStorage.removeItem(TOKEN)
  localStorage.removeItem(EMAIL)
}
