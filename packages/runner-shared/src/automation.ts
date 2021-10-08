export const automationStatus = ['CONNECTING', 'MISSING', 'CONNECTED', 'DISCONNECTED'] as const

export const automation: Record<string, typeof automationStatus[number]> = {
  CONNECTING: 'CONNECTING',
  MISSING: 'MISSING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
} as const
