import type { CyPromptServerShape } from './cy-prompt-server-types'

export * from './cy-prompt-server-types'

export const CY_PROMPT_STATUSES = ['NOT_INITIALIZED', 'INITIALIZING', 'INITIALIZED', 'IN_ERROR'] as const

export type CyPromptStatus = typeof CY_PROMPT_STATUSES[number]

export interface CyPromptManagerShape extends CyPromptServerShape {
  status: CyPromptStatus
}

export interface CyPromptLifecycleManagerShape {
  getCyPrompt: () => Promise<CyPromptManagerShape | null>
  registerCyPromptReadyListener: (listener: (cyPromptManager: CyPromptManagerShape) => void) => void
}
