import { FoundBrowser, Editor, AllowedState, AllModeOptions, TestingType, BrowserStatus, PACKAGE_MANAGERS, AuthStateName, MIGRATION_STEPS, MigrationStep, BannerState } from '@packages/types'
import { WizardBundler, CT_FRAMEWORKS, resolveComponentFrameworkDefinition, ErroredFramework } from '@packages/scaffold-config'
import type { NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { App, BrowserWindow } from 'electron'
import type { ChildProcess } from 'child_process'
import type { SocketIONamespace, SocketIOServer } from '@packages/socket'
import type { Server } from 'http'
import type { ErrorWrapperSource } from '@packages/errors'
import type { EventCollectorSource, GitDataSource, LegacyCypressConfigJson } from '../sources'
import { machineId as getMachineId } from 'node-machine-id'
import type { CDPSocketServer } from '@packages/socket/lib/cdp-socket'

export type Maybe<T> = T | null | undefined

export interface AuthenticatedUserShape {
  id?: string //Cloud user id
  name?: string
  email?: string
  authToken?: string
}

export interface ProjectShape {
  projectRoot: string
  savedState?: () => Promise<Maybe<SavedStateShape>>
}

export interface ServersDataShape {
  appServer?: Maybe<Server>
  appServerPort?: Maybe<number>
  appSocketServer?: Maybe<SocketIOServer>
  appSocketNamespace?: Maybe<SocketIONamespace>
  cdpSocketServer?: CDPSocketServer | undefined
  cdpSocketNamespace?: CDPSocketServer | undefined
  gqlServer?: Maybe<Server>
  gqlServerPort?: Maybe<number>
  gqlSocketServer?: Maybe<SocketIONamespace>
}

export interface DevStateShape {
  refreshState: null | string
}

export interface LocalSettingsDataShape {
  refreshing: Promise<Editor[]> | null
  availableEditors: Editor[]
  preferences: AllowedState
}

export interface SavedStateShape {
  firstOpened?: number | null
  lastOpened?: number | null
  promptsShown?: object | null
  banners?: BannerState | null
  lastProjectId?: string | null
  specFilter?: string | null
}

export interface ConfigChildProcessShape {
  /**
   * Child process executing the config & sourcing plugin events
   */
  process: ChildProcess
  /**
   * Keeps track of which plugins we have executed in the current config process
   */
  executedPlugins: null | 'e2e' | 'ct'
  /**
   * Config from the initial module.exports
   */
  resolvedBaseConfig: Promise<Cypress.ConfigOptions>
}

export interface AppDataShape {
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

export interface MigrationDataShape {
  // TODO: have the model of migration here
  step: MigrationStep
  videoEmbedHtml: string | null
  legacyConfigForMigration?: LegacyCypressConfigJson | null
  filteredSteps: MigrationStep[]
  flags: {
    hasCustomIntegrationFolder: boolean
    hasCustomIntegrationTestFiles: boolean

    hasCustomComponentFolder: boolean
    hasCustomComponentTestFiles: boolean

    hasCustomSupportFile: boolean
    hasComponentTesting: boolean
    hasE2ESpec: boolean
    hasPluginsFile: boolean
    shouldAddCustomE2ESpecPattern: boolean
  }
}

export interface ElectronShape {
  app: App | null
  browserWindow: BrowserWindow | null
}

export interface AuthStateShape {
  name?: AuthStateName
  message?: string
  browserOpened: boolean
}

export interface ForceReconfigureProjectDataShape {
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
  migration: MigrationDataShape
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
    migration: {
      step: 'renameAuto',
      videoEmbedHtml: null,
      legacyConfigForMigration: null,
      filteredSteps: [...MIGRATION_STEPS],
      flags: {
        hasCustomIntegrationFolder: false,
        hasCustomIntegrationTestFiles: false,
        hasCustomComponentFolder: false,
        hasCustomComponentTestFiles: false,
        hasCustomSupportFile: false,
        hasComponentTesting: true,
        hasE2ESpec: true,
        hasPluginsFile: true,
        shouldAddCustomE2ESpecPattern: false,
      },
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
  }

  async function machineId (): Promise<string | null> {
    try {
      return await getMachineId()
    } catch (error) {
      return null
    }
  }
}
