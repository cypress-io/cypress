import type { FoundBrowser } from '@packages/types'
import type { EventEmitter } from 'events'

export type Browser = FoundBrowser & {
  majorVersion: number
  isHeadless: boolean
  isHeaded: boolean
}

export type BrowserInstance = EventEmitter & {
  kill: () => void
  pid: number
}
