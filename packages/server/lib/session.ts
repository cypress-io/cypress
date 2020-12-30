import { CyCookie } from './browsers/cdp_automation'

interface SessionData {
  cookies: CyCookie[]
  name: string
  localStorage: object
  sessionStorage: object
}
const state = {
  sessions: {},
}

export function saveSession (data: SessionData) {
  if (!data.name) throw new Error('session data had no name')

  state.sessions[data.name] = data
}

export function getSession (name: string): SessionData {
  const session = state.sessions[name]

  if (!session) throw new Error(`session with name "${name}" not found`)

  return session
}

export function getState () {
  return state
}

export function clearSessions () {
  state.sessions = {}
}
