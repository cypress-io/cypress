// Note: This file is owned by the cloud delivered
// `studio` bundle. It is downloaded and copied to the app.
// It should not be modified directly in the app.

import type { Text } from '@uiw/react-codemirror'

export type RecordingState = 'recording' | 'paused' | 'disabled'

export type CloudStatus =
  | 'isLoggedOut'
  | 'needsOrgConnect'
  | 'needsProjectConnect'
  | 'needsRecordedRun'
  | 'allTasksCompleted'

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

export interface SpecDirtyDataStore {
  setDirtyStateForKey: (key: string, isDirty: boolean) => void
  getDirtyStateForKey: (key: string) => boolean
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

export interface AssertionOption {
  name?: string
  value?: string | number | string[]
}

export interface AssertionType {
  type: string
  options?: AssertionOption[]
}

export type PossibleAssertions = AssertionType[]

// Single argument assertion: ['be.visible']
export type AssertionArgs_1 = [string]

// Two argument assertion: ['have.text', '<some text>']
export type AssertionArgs_2 = [string, string]

// Three argument assertion: ['have.attr', 'href', '<some value>']
export type AssertionArgs_3 = [string, string, string]

export type AssertionArgs = AssertionArgs_1 | AssertionArgs_2 | AssertionArgs_3

// This is a subset of the StudioStore interface that is used in this repo's
// usage of the StudioStore. StudioStore is implemented in the app, so make
// sure the types defined here match the actual types implemented there.
export interface StudioStore {
  needsUrl: boolean
  newTestLineNumber?: number
  suiteId?: string
  url: string
  setNewTestLineNumber: (newTestLineNumber: number | undefined) => void
  $subscribe: (callback: () => void) => void
  _closeAssertionsMenu: (autBody: HTMLElement) => void
  _isAssertionsMenu: (autBody: HTMLElement) => boolean
  _openAssertionsMenu: (
    event: Event,
    autBody: HTMLElement,
    addAssertion: (
      el: HTMLElement | JQuery<HTMLElement>,
      ...args: AssertionArgs
    ) => void,
    generatePossibleAssertions: (el: JQuery<Element>) => PossibleAssertions
  ) => void
}

// This is a subset of the EventManager interface that is used in this repo's
// usage of the EventManager. EventManager is implemented in the app, so make
// sure the types defined here match the actual types implemented there.
export interface StudioEventManager {
  studioStore: StudioStore
  on: (event: string, callback: (arg: any) => any) => void
  off: (event: string, callback: (arg: any) => any) => void
  ws: {
    emit: (event: string, ...args: any[]) => void
  }
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
  userProjectStatusStore?: UserProjectStatusStore
  hasRequestedProjectAccess?: boolean
  requestProjectAccessMutation?: RequestProjectAccessMutation
  specDirtyDataStore?: SpecDirtyDataStore
}

export type StudioPanelShape = (props: StudioPanelProps) => JSX.Element

export interface StudioAppDefaultShape {
  // Purposefully do not use React in this signature to avoid conflicts when this type gets
  // transferred to the Cypress app
  StudioPanel: StudioPanelShape
}

export type CypressInternal = Cypress.Cypress &
CyEventEmitter & {
  state<V = any>(key: string): V
  state<V = any>(key: string, value: any): V
  $autIframe: JQuery<HTMLIFrameElement>
  mocha: {
    getRootSuite: () => Suite
  }
  areSourceMapsAvailable?: boolean
  stackUtils?: {
    getSourceDetailsForFirstLine: (
      stack: string,
      projectRoot: string
    ) => {
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
    indentation: string
    indentationType?: IndentationType
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

export interface AIGenerationResult {
  recommendation: string
  generationId: string
}

export type SynchronizationMetadata = {
  timestamp: number
  sequence: number
  frameId: string
}

export type UsageLimitReached = {
  timeUntilReset: number
  usageWindowEnd: number
}

export type RecommendationsById = Record<Recommendation['id'], Recommendation>

export interface StudioAIGeneration {
  isGenerating: boolean
  startGenerating: (
    lineContent: string,
    lineNumber: number,
    getPendingTestBlock: () => string | undefined,
    targetEventTimingMetadata?: SynchronizationMetadata | undefined
  ) => Promise<void>
  stopGenerating: () => void
  removeRecommendation: (recommendationId: string) => void
  updateRecommendationPositions: (
    startLine: number,
    lineDiff: number,
    documentText: Text
  ) => void
  recommendationsById: RecommendationsById
  setRecommendationsById: React.Dispatch<
    React.SetStateAction<RecommendationsById>
  >
  usageLimitReached: UsageLimitReached | null
}

export type EmptyRecommendation = {
  type: 'NONE'
}

export type ValidRecommendation = {
  content: string
}

export type StudioRecommendation = EmptyRecommendation | ValidRecommendation

export interface GenerateResponse {
  generationId: string
  recommendations: StudioRecommendation[]
}

export interface TestContentRetrieverProps {
  Cypress: CypressInternal
  showCypressGrepError: boolean
  isCucumberSpec: boolean
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

export type IndentationType = 'space' | 'tab'

export interface Recommendation {
  id: string // client-side generated id
  isShowing: boolean
  editorLineContent: string
  editorLineNumber: number
  generationId?: string // server-side generated id
  generatedAssertions?: string
}

const AI_STATUS_TYPES = [
  'unsupported-browser',
  'user-not-logged-in',
  'project-id-not-set',
  'project-not-connected',
  'user-not-member-of-project',
  'usage-limit-reached',
  'ai-disabled',
] as const

export type AIStatusType = (typeof AI_STATUS_TYPES)[number]

export interface AIStatusDetails {
  type: AIStatusType
  title: string
  message: string | React.ReactNode | (() => string | React.ReactNode)
  icon?: React.ReactNode
  action?: () => React.ReactNode
  collapsedAction?: {
    label: () => React.ReactNode
    onClick: () => void
    disabled?: boolean
  }
}

export type AIStatus = 'enabled' | 'disabled' | 'not-available'

// Studio-specific state interface (matches server-side)
export interface StudioSavedState {
  aiStatus?: Partial<
    Record<
      AIStatusType,
      {
        isCollapsed: boolean
        lastUpdated: number
      }
    >
  >
  // if the user has been shown the first recommendation ever generated for
  // them. after it's displayed, all future recommendations are collapsed
  // by default
  wasFirstRecommendationShown?: boolean
}

export interface StudioStateInterface {
  isLoading: boolean
  state: StudioSavedState
  saveState: (stateUpdates: Partial<StudioSavedState>) => void
}
