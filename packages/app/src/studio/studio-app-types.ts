export interface StudioPanelProps {
  canAccessStudioAI: boolean
  onStudioPanelClose?: () => void
  useRunnerStatus?: RunnerStatusShape
  useTestContentRetriever?: TestContentRetrieverShape
  useStudioAIStream?: StudioAIStreamShape
  useCypress?: CypressShape
}

export type StudioPanelShape = (props: StudioPanelProps) => JSX.Element

export interface StudioAppDefaultShape {
  // Purposefully do not use React in this signature to avoid conflicts when this type gets
  // transferred to the Cypress app
  StudioPanel: StudioPanelShape
}

export type CypressInternal = Cypress.Cypress &
CyEventEmitter & {
  state: (key: string) => any
}

export interface TestBlock {
  content: string
  testBodyPosition: {
    contentStart: number
    contentEnd: number
    indentation: number
  }
}

export type RunnerStatus = 'running' | 'finished'

export interface RunnerStatusProps {
  Cypress: CypressInternal
}

export interface CypressProps {
  Cypress: CypressInternal
}

export type CypressShape = (props: CypressProps) => {
  currentCypress: CypressInternal
}

export type RunnerStatusShape = (props: RunnerStatusProps) => {
  runnerStatus: RunnerStatus
}

export interface StudioAIStreamProps {
  canAccessStudioAI: boolean
  runnerStatus: RunnerStatus
  testCode?: string
  isCreatingNewTest: boolean
}

export interface StudioAIStream {
  recommendation: string
  isStreaming: boolean
  generationId: string | null
}

export type StudioAIStreamShape = (props: StudioAIStreamProps) => StudioAIStream

export interface TestContentRetrieverProps {
  Cypress: CypressInternal
}

export type TestContentRetrieverShape = (props: TestContentRetrieverProps) => {
  isLoading: boolean
  testBlock: TestBlock | null
  isCreatingNewTest: boolean
}

export interface Command {
  selector?: string
  name: string
  message?: string | string[]
  isAssertion?: boolean
}

export interface SaveDetails {
  absoluteFile: string
  runnableTitle: string
  contents: string
  testName?: string
}
