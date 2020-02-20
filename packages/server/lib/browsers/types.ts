import { FoundBrowser } from '@packages/launcher'

export type Browser = FoundBrowser & {
  majorVersion: number
  isHeadless: boolean
  isHeaded: boolean
}
