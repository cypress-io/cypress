import type { FoundBrowser, Editor, AllowedState, AllModeOptions, TestingType, BrowserStatus, PACKAGE_MANAGERS, AuthStateName, StudioLifecycleManagerShape, CyPromptLifecycleManagerShape, Maybe } from '@packages/types'
import { WizardBundler, CT_FRAMEWORKS, resolveComponentFrameworkDefinition, ErroredFramework } from '@packages/scaffold-config'
import type { NexusGenObjects } from '../gen/nxs.gen'
// tslint:disable-next-line no-implicit-dependencies - electron dep needs to be defined
import type { App, BrowserWindow } from 'electron'
import type { SocketIONamespace, SocketIOServer, CDPSocketServer } from '@packages/socket'
import type { Server } from 'http'
import type { ErrorWrapperSource } from '@packages/errors'
import type { EventCollectorSource, GitDataSource } from '../sources'
import { machineId as getMachineId } from 'node-machine-id'

export interface AuthenticatedUserShape {
  id?: string //Cloud user id
  name?: string
  email?: string
  authToken?: string
}

export interface ProjectShape {
  projectRoot: string
  savedState?: () => Promise<AllowedState>
}

interface ServersDataShape {
  appServer?: Maybe<Server>
  appServerPort?: Maybe<number>
  appSocketServer?: Maybe<SocketIOServer>
  appSocketNamespace?: Maybe<SocketIONamespace>
  cdpSocketServer?: CDPSocketServer | undefined
  cdpSocketNamespace?: CDPSocketServer | undefined
  gqlServer?: Maybe<Server>
  gqlServerPort?: Maybe<number>
  gqlSocketServer?: Maybe<SocketIONamespace>
  inspect?: {
    token: string
    descriptorPath: string
    startedAt: string
  }
}

export interface DevStateShape {
  refreshState: null | string
}

interface LocalSettingsDataShape {
  refreshing: Promise<Editor[]> | null
  availableEditors: Editor[]
  preferences: AllowedState
}

interface AppDataShape {
  isGlobalMode: boolean
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: ProjectShape[]
  nodePath: Maybe<string>
  nodeVersion: Maybe<string>
  browserStatus: BrowserStatus
  browserUserAgent: string | null
  relaunchBrowser: boolean
}

export interface WizardDataShape {
  chosenBundler: WizardBundler | null
  chosenFramework: Cypress.ResolvedComponentFrameworkDefinition | null
  chosenManualInstall: boolean
  detectedBundler: WizardBundler | null
  detectedFramework: Cypress.ResolvedComponentFrameworkDefinition | null
  frameworks: Cypress.ResolvedComponentFrameworkDefinition[]
  erroredFrameworks: ErroredFramework[]
}

interface ElectronShape {
  app: App | null
  browserWindow: BrowserWindow | null
}

export interface AuthStateShape {
  name?: AuthStateName
  message?: string
  browserOpened: boolean
}

interface ForceReconfigureProjectDataShape {
  e2e?: boolean | null
  component?: boolean | null
}

interface Diagnostics {
  error: ErrorWrapperSource | null
  warnings: ErrorWrapperSource[]
}

interface CloudDataShape {
  testsForRunResults?: Record<string, string[]>
  metadata?: {
    id?: string
    name?: string
  }
}

interface RecordingInfo {
  runId?: string
  instanceId?: string
}

export type ActiveRunStatus = 'starting' | 'running' | 'finished'

export type TestResultState = 'passed' | 'failed' | 'pending' | 'skipped'

export interface TestResultShape {
  testId: string
  title: string
  titlePath: string[]
  state: TestResultState
  duration: number | null
  currentRetry: number
  error: string | null
}

export interface ActiveRunShape {
  specPath: string
  startedAt: string
  endedAt: string | null
  status: ActiveRunStatus
  /**
   * Per-test outcomes, keyed by Mocha test id. Retries overwrite the prior
   * entry so the map always reflects the latest attempt's terminal state.
   * Stats are derived on read — see `gql-InspectSnapshot`.
   */
  tests: Record<string, TestResultShape>
}

/**
 * Shape of a single command log entry surfaced to CLI consumers. Sourced
 * on-demand from the reporter's MobX store — no server-side buffer. Rich
 * metadata fields (snapshots, alias, timings, etc.) are present for the
 * `cypress inspect command` family; simpler consumers (`inspect test`) ignore
 * them. `snapshotCount` is enriched at the `event-manager` level from the
 * driver log, since the reporter only tracks `hasSnapshot` as a boolean.
 */
export interface CommandSnapshotShape {
  id: string
  name: string
  message: string
  state: string
  type: string
  testId: string | null
  displayName: string | null
  number: number | null
  snapshotCount: number
  hasSnapshot: boolean
  hasConsoleProps: boolean
  timeout: number | null
  numElements: number | null
  visible: boolean | null
  groupLevel: number | null
  group: number | null
  alias: string | null
  aliasType: string | null
  referencesAlias: string[] | null
  hookId: string | null
  error: string | null
  wallClockStartedAt: string | null
}

/**
 * Shape of the currently pinned command (via `cy inspect command pin`).
 * `consolePropsJson` is a safe-stringified dump of `Cypress.runner.getConsolePropsForLog`,
 * fetched fresh per read from the driver — not buffered.
 */
export interface PinnedCommandShape {
  testId: string
  logId: string
  consolePropsJson: string | null
}

/**
 * Per-logId result for `requestCommandConsoleProps` — a read-only sibling of
 * `PinnedCommandShape`. No reporter-state mutation: fetching this does NOT pin
 * the command in the UI.
 */
export interface CommandConsolePropsShape {
  logId: string
  consolePropsJson: string | null
}

/**
 * Shape of a single match in an `autInspectDom` response. `text` and
 * `outerHTML` are truncated by the runner (500/2048 chars respectively).
 */
export interface AutInspectDomMatchShape {
  tag: string
  text: string | null
  attrs: Array<{ name: string, value: string }>
  outerHTML: string
}

/**
 * Success payload for the bare `autInspect` query: a snapshot of the AUT
 * iframe's URL, title, and viewport dimensions. `title` is nullable because
 * cross-origin AUTs make `document.title` inaccessible.
 */
export interface AutInspectRootShape {
  url: string
  title: string | null
  viewportWidth: number
  viewportHeight: number
}

/**
 * Success payload for `autInspectDom(selector)`: the selector echoed back,
 * the total match count, and the capped match list (up to 20).
 */
export interface AutInspectDomShape {
  selector: string
  count: number
  matches: AutInspectDomMatchShape[]
}

export type AutInspectRunnerError = {
  error: 'AUT_UNAVAILABLE' | 'INVALID_SELECTOR'
  detailMessage?: string
}

/**
 * Tagged payloads from the runner for `inspect:request-aut` round trips.
 * The server treats `null` (from `requestRunner` timeout) as a separate
 * `TIMEOUT` case — see `gql-Query.autInspect`.
 */
export type AutInspectRootRunnerPayload =
  | { data: AutInspectRootShape }
  | AutInspectRunnerError

export type AutInspectDomRunnerPayload =
  | { data: AutInspectDomShape }
  | AutInspectRunnerError

/**
 * One node in the AUT accessibility tree. Shape mirrors the Chrome DevTools
 * Accessibility tab at a coarse grain: role, accessible name, a handful of
 * state fields, a CSS selector that targets the underlying element, and
 * recursive children (only nodes that carry a role — purely layout elements
 * are collapsed).
 */
export interface AutInspectA11yNodeShape {
  role: string
  name: string | null
  level: number | null
  value: string | null
  checked: boolean | null
  disabled: boolean | null
  selector: string
  children: AutInspectA11yNodeShape[]
}

/**
 * Success payload for `autInspectSnapshot`: the AUT's URL/title/viewport plus
 * a compact accessibility tree with unique-ish selectors. `truncated` is true
 * when the walker hit its node cap; `nodeCount` is the pre-cap count.
 */
export interface AutInspectSnapshotShape {
  url: string
  title: string | null
  viewportWidth: number
  viewportHeight: number
  nodeCount: number
  truncated: boolean
  tree: AutInspectA11yNodeShape
}

export type AutInspectSnapshotRunnerPayload =
  | { data: AutInspectSnapshotShape }
  | AutInspectRunnerError

export interface CoreDataShape {
  cliBrowser: string | null
  cliTestingType: string | null
  activeBrowser: FoundBrowser | null
  machineId: Promise<string | null>
  machineBrowsers: Promise<FoundBrowser[]> | null
  allBrowsers: Promise<FoundBrowser[]> | null
  servers: ServersDataShape
  hasInitializedMode: 'run' | 'open' | null
  cloudGraphQLError: ErrorWrapperSource | null
  dev: DevStateShape
  localSettings: LocalSettingsDataShape
  app: AppDataShape
  currentProject: string | null
  currentProjectGitInfo: GitDataSource | null
  currentTestingType: TestingType | null
  diagnostics: Diagnostics
  wizard: WizardDataShape
  user: AuthenticatedUserShape | null
  electron: ElectronShape
  authState: AuthStateShape
  scaffoldedFiles: NexusGenObjects['ScaffoldedFile'][] | null
  packageManager: typeof PACKAGE_MANAGERS[number]
  forceReconfigureProject: ForceReconfigureProjectDataShape | null
  versionData: {
    latestVersion: Promise<string>
    npmMetadata: Promise<Record<string, string>>
  } | null
  cloudProject: CloudDataShape
  eventCollectorSource: EventCollectorSource | null
  didBrowserPreviouslyHaveUnexpectedExit: boolean
  studioLifecycleManager?: StudioLifecycleManagerShape
  /**
   * Runtime id of the test currently targeted by Studio, if any. Set by the
   * `studioInitTest` mutation and cleared by `studioCancel` / `runSpec`. The
   * browser Pinia store has the same info locally; this mirror lets the CLI
   * distinguish "Studio active" from "not in Studio" via `inspectSnapshot`.
   */
  studioActiveTestId: string | null
  cyPromptLifecycleManager?: CyPromptLifecycleManagerShape
  currentRecordingInfo: RecordingInfo
  activeRun: ActiveRunShape | null
}

/**
 * All state for the app should live here for now
 */
export function makeCoreData (modeOptions: Partial<AllModeOptions> = {}): CoreDataShape {
  return {
    servers: {},
    cliBrowser: modeOptions.browser ?? null,
    cliTestingType: modeOptions.testingType ?? null,
    machineId: machineId(),
    machineBrowsers: null,
    allBrowsers: null,
    hasInitializedMode: null,
    cloudGraphQLError: null,
    dev: {
      refreshState: null,
    },
    app: {
      isGlobalMode: Boolean(modeOptions.global),
      browsers: null,
      projects: [],
      nodePath: modeOptions.userNodePath,
      nodeVersion: modeOptions.userNodeVersion,
      browserStatus: 'closed',
      browserUserAgent: null,
      relaunchBrowser: false,
    },
    localSettings: {
      availableEditors: [],
      preferences: {},
      refreshing: null,
    },
    authState: {
      browserOpened: false,
    },
    currentProject: modeOptions.projectRoot ?? null,
    diagnostics: { error: null, warnings: [] },
    currentProjectGitInfo: null,
    currentTestingType: modeOptions.testingType ?? null,
    wizard: {
      chosenBundler: null,
      chosenFramework: null,
      chosenManualInstall: false,
      detectedBundler: null,
      detectedFramework: null,
      // TODO: API to add third party frameworks to this list.
      frameworks: CT_FRAMEWORKS.map((framework) => resolveComponentFrameworkDefinition(framework)),
      erroredFrameworks: [],
    },
    activeBrowser: null,
    user: null,
    electron: {
      app: null,
      browserWindow: null,
    },
    scaffoldedFiles: null,
    packageManager: 'npm',
    forceReconfigureProject: null,
    versionData: null,
    cloudProject: {
      testsForRunResults: {},
    },
    eventCollectorSource: null,
    didBrowserPreviouslyHaveUnexpectedExit: false,
    studioLifecycleManager: undefined,
    studioActiveTestId: null,
    currentRecordingInfo: {},
    activeRun: null,
  }

  async function machineId (): Promise<string | null> {
    try {
      return await getMachineId()
    } catch (error) {
      return null
    }
  }
}
