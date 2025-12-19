// Note: This file is owned by the cloud delivered
// `studio` bundle. It is downloaded and copied to the app.
// It should not be modified directly in the app.

import type { CloudStatus } from '@cy/store/user-project-status-store'

export type RecordingState = 'recording' | 'paused' | 'disabled'

export interface UserProjectStatusStore {
  user: {
    isLoggedIn: boolean
  }
  project: {
    isProjectConnected: boolean
    isNotAuthorized: boolean
  }
  openLoginConnectModal: (options: { utmMedium: string }) => void
  cloudStatus: CloudStatus
  projectId: string
}

export interface RequestProjectAccessMutationResult {
  data?: {
    cloudProjectRequestAccess: {
      hasRequestedAccess: boolean
    }
  }
  error?: any
}

export interface RequestProjectAccessMutation {
  executeMutation: (variables: {
    projectId: string
  }) => Promise<RequestProjectAccessMutationResult>
}

const SPEC_DIRTY_DATA_MODULES = Object.freeze({
  STUDIO: {
    name: 'Studio',
  },
})

export type SpecDirtyDataModule = (typeof SPEC_DIRTY_DATA_MODULES)[keyof typeof SPEC_DIRTY_DATA_MODULES]

export type SpecDirtyDataModuleKey = keyof typeof SPEC_DIRTY_DATA_MODULES

export interface SpecDirtyDataStore {
  setDirtyStateForKey: (key: SpecDirtyDataModuleKey, isDirty: boolean) => void
  getDirtyStateForKey: (key: SpecDirtyDataModuleKey) => boolean
  getDirtyModules: () => SpecDirtyDataModule[]
  isDirty: () => boolean
  resetDirtyState: () => void
}

export interface StudioPanelProps {
  canAccessStudioAI: boolean
  onStudioPanelClose?: () => void
  studioSessionId?: string
  useRunnerStatus?: RunnerStatusShape
  useTestContentRetriever?: TestContentRetrieverShape
  useCypress?: CypressShape
  autUrlSelector?: string
  studioAiAvailable?: boolean
  userProjectStatusStore: UserProjectStatusStore
  hasRequestedProjectAccess: boolean
  requestProjectAccessMutation: RequestProjectAccessMutation
  specDirtyDataStore: SpecDirtyDataStore
  isSelectorPlaygroundOpen?: boolean
  // Callback to close the Selector Playground
  onCloseSelectorPlayground?: () => void
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
  $autIframe: JQuery<HTMLIFrameElement>
  mocha: {
    getRootSuite: () => Suite
  }
  areSourceMapsAvailable?: boolean
  stackUtils?: {
    getSourceDetailsForFirstLine: (stack: string, projectRoot: string) => {
      line: number
      column: number
      file: string
    }
  }
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
  Cypress: CypressInternal
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

export type Suite = {
  id: string
  title: string
  suites?: Suite[]
  invocationDetails: {
    line: number
    column: number
  }
}
