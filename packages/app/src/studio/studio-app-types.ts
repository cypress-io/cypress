export interface StudioPanelProps {
  canAccessStudioAI: boolean
  useStudioEventManager?: StudioEventManagerShape
  useStudioAIStream?: StudioAIStreamShape
}

export type StudioPanelShape = (props: StudioPanelProps) => JSX.Element

export interface StudioAppDefaultShape {
  // Purposefully do not use React in this signature to avoid conflicts when this type gets
  // transferred to the Cypress app
  StudioPanel: StudioPanelShape
}

export interface StudioEventManagerProps {
  Cypress: Cypress.Cypress & CyEventEmitter
}

export type RunnerStatus = 'running' | 'finished'

export type StudioEventManagerShape = (props: StudioEventManagerProps) => {
  runnerStatus: RunnerStatus
  testBlock: string | null
}

export interface StudioAIStreamProps {
  canAccessStudioAI: boolean
  AIOutputRef: { current: HTMLTextAreaElement | null }
  runnerStatus: RunnerStatus
}

export type StudioAIStreamShape = (props: StudioAIStreamProps) => void
