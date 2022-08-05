import type { CyCookie } from './browsers/cdp_automation'

interface SessionData {
  cacheAcrossSpecs: boolean
  cookies: CyCookie[]
  id: string
  localStorage: object
  sessionStorage: object
}

const state: {
  globalSessions: Record<string, SessionData>
  specSessions: Record<string, SessionData>
} = {
  globalSessions: {},
  specSessions: {},
}

export function saveSession (data: SessionData) {
  if (!data.id) throw new Error('session data had no id')

  console.log('data,', data)
  if (data.cacheAcrossSpecs) {
    state.globalSessions[data.id] = data
    console.log('add as globalSessions,')

    return
  }

  state.specSessions[data.id] = data
}

export function getGlobalSessions (): Record<string, SessionData> {
  return state.globalSessions
}

export function getSession (id: string): SessionData {
  console.log('get session....', id)
  console.log('  globalSessions....', state.globalSessions)
  console.log('  specSessions....', state.specSessions)
  const session = state.globalSessions[id] || state.specSessions[id]

  if (!session) throw new Error(`session with id "${id}" not found`)

  return session
}

export function getState () {
  return state
}

export function clearSpecSessions () {
  state.specSessions = {}
}

export function clearAllSessions () {
  state.globalSessions = {}
  state.specSessions = {}
}
