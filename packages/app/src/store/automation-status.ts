export const automation = {
  CONNECTING: 'CONNECTING',
  MISSING: 'MISSING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
} as const

export type AutomationStatus = keyof typeof automation
