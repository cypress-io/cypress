import type { CyCookie } from './browsers/cdp_automation'

interface SessionData {
  cookies: CyCookie[]
  id: string
  localStorage: object
  sessionStorage: object
}
const state = {
  sessions: {},
}

export function saveSession (data: SessionData) {
  if (!data.id) throw new Error('session data had no id')

  state.sessions[data.id] = data
}

export function getSession (id: string): SessionData {
  const session = state.sessions[id]

  if (!session) throw new Error(`session with id "${id}" not found`)

  return session
}

export function getState () {
  return state
}

export function clearSessions () {
  state.sessions = {}
}
