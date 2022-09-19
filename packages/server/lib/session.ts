import type { ServerSessionData, StoredSessions } from '@packages/types'

type State = {
  globalSessions: StoredSessions
  specSessions: StoredSessions
}

const state: State = {
  globalSessions: {},
  specSessions: {},
}

export function saveSession (data: ServerSessionData): void {
  if (!data.id) throw new Error('session data had no id')

  if (data.cacheAcrossSpecs) {
    state.globalSessions[data.id] = data

    return
  }

  state.specSessions[data.id] = data
}

export function getActiveSessions (): StoredSessions {
  return state.globalSessions
}

export function getSession (id: string): ServerSessionData {
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
