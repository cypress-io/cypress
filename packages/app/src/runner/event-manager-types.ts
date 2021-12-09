import type { FileDetails } from '@packages/types'

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
  'open:file': FileDetails
}

export type LocalBusEmitsMap = {
  'open:file': FileDetails
}
