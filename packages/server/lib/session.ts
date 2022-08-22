import type { CyCookie } from './browsers/cdp_automation'

interface SessionData {
  cookies: CyCookie[]
  id: string
  cacheAcrossSpecs: boolean
  localStorage: Array<Record<string, string>>
  sessionStorage: Array<Record<string, string>>
}

type State = {
  globalSessions: Record<string, SessionData>
  specSessions: Record<string, SessionData>
}

const state: State = {
  globalSessions: {},
  specSessions: {},
}

export function saveSession (data: SessionData): void {
  if (!data.id) throw new Error('session data had no id')

  if (data.cacheAcrossSpecs) {
    state.globalSessions[data.id] = data

    return
  }

  state.specSessions[data.id] = data
}

export function getGlobalSessions (): Record<string, SessionData> {
  return state.globalSessions
}

export function getSession (id: string): SessionData {
  const session = state.globalSessions[id] || state.specSessions[id]

  if (!session) throw new Error(`session with id "${id}" not found`)

  return session
}

export function getState (): State {
  return state
}

export function clearSessions (clearAllSessions: boolean = false): void {
  state.specSessions = {}

  if (clearAllSessions) {
    state.globalSessions = {}
  }
}
