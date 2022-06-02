import type { FileDetails } from '@packages/types'
import type { ScriptError } from '../store'
import type { CypressInCypressMochaEvent } from './event-manager'

interface BeforeScreenshot {
  appOnly: boolean
  blackout: string[]
  disableTimersAndAnimations: boolean
  id: `r${number}`
  isOpen: boolean
  overwrite: boolean
  scale: boolean
  testAttemptIndex: number
  waitForCommandSynchronization: boolean
}

export type LocalBusEventMap = {
  'before:screenshot': BeforeScreenshot
  'after:screenshot': undefined
  'open:file': FileDetails
}

export type LocalBusEmitsMap = {
  'open:file': FileDetails
  'cypress:in:cypress:run:complete': CypressInCypressMochaEvent[]
}

export type SocketToDriverMap = {
  'script:error': ScriptError
}

export type DriverToLocalBus = {
  'visit:blank': { type?: 'session' | 'session-lifecycle' }
  'visit:failed': { status?: string, statusText: string, contentType?: () => string }
}
