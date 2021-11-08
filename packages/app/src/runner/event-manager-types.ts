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
}
