import { CookieJar } from 'tough-cookie'
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
// TODO: should this live here? it doesn't have quite the same lifecycle
// as this session data
const cookieJar = new CookieJar(undefined, { allowSpecialUseDomain: true })

export function resetCookieJar () {
  cookieJar.removeAllCookiesSync()
}

export function getCookieJar () {
  return cookieJar
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
  resetCookieJar()
}
