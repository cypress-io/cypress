import type { FileDetails } from '@packages/types'
import type { ScriptError } from '../store'
import type { CommandLog, EntrySource } from '../store/studio-store'
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
  'testFilter:cloudDebug:dismiss': undefined
}

export type LocalBusEmitsMap = {
  // Local Bus
  'restart': undefined
  'open:file': FileDetails
  'cypress:in:cypress:run:complete': CypressInCypressMochaEvent[]

  // Studio Events
  'studio:cancel': undefined
  'studio:init:suite': { suiteId: string, entrySource?: EntrySource, showUrlPrompt?: boolean }

  // Reporter Events
  'reporter:log:add': CommandLog
  'reporter:log:remove': CommandLog
  'reporter:log:state:changed': CommandLog

  // Test filter events
  'testFilter:cloudDebug:dismiss': undefined
}

export type SocketToDriverMap = {
  'script:error': ScriptError
}

export type DriverToLocalBus = {
  'visit:blank': { testIsolation?: boolean }
  'visit:failed': { status?: string, statusText: string, contentType?: () => string }
  'page:loading': boolean
}
