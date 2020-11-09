import _ from 'lodash'
import { CyCookie } from './browsers/cdp_automation'

interface SessionData {
  cookies: CyCookie[]
  name: string
  localStorage: object
  sessionStorage: object
}
const sessions = {}
const state = {
  stubbedDomainsForAutomation: null,
}

const defaultState = _.clone(state)

export function saveSession (data: SessionData) {
  if (!data.name) throw new Error('session data had no name')

  sessions[data.name] = data
}

export function getSession (name: string): SessionData {
  const session = sessions[name]

  if (!session) throw new Error(`session with name "${name}" not found`)

  return session
}

export function getState () {
  return state
}

export function resetState () {
  _.assign(state, defaultState)
}
