import type { FoundBrowser } from '@packages/launcher'
import type { EventEmitter } from 'events'

export interface Browser extends Omit<FoundBrowser, 'majorVersion'> {
  majorVersion: number | string
  isHeadless: boolean
  isHeaded: boolean
}

export type BrowserInstance = EventEmitter & {
  kill: () => void
  pid: number
}
