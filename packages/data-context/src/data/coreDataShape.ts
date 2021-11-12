import { BUNDLERS, FoundBrowser, FoundSpec, FullConfig, LaunchArgs, Preferences } from '@packages/types'
import type { NexusGenEnums, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { BrowserWindow } from 'electron'
import type { ChildProcess } from 'child_process'
import path from 'path'

export type Maybe<T> = T | null | undefined

export interface AuthenticatedUserShape {
  name?: string
  email?: string
  authToken?: string
}

export interface ProjectShape {
  projectRoot: string
}

export interface DevStateShape {
  refreshState: null | string
}

export interface ConfigChildProcessShape {
  process: ChildProcess
  executedPlugins: null | 'e2e' | 'ct'
}

export interface CurrentProjectShape extends ProjectShape {
  /**
   * Title of the project is the "basename" of the project
   */
  title: string
  /**
   * The "current testing type" chosen for the project
   */
  currentTestingType: Maybe<TestingTypeEnum>
  /**
   * the --browser flag, if specified by the CLI via LaunchArgs
   */
  cliBrowser?: string
  /**
   * Warning when the cliBrowser doesn't match up with the browsers
   * that are available after sourcing the config
   */
  browserErrorMessage?: string | null
  ctPluginsInitialized?: Maybe<boolean>
  e2ePluginsInitialized?: Maybe<boolean>
  specs?: FoundSpec[]
  config?: Promise<FullConfig> | null
  configChildProcess?: ConfigChildProcessShape | null
  preferences?: Preferences| null
  browsers?: FoundBrowser[] | null
}

export interface AppDataShape {
  navItem: NexusGenEnums['NavItem']
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: string[]
  currentProject: CurrentProjectShape | null
  isInGlobalMode: boolean
  isAuthBrowserOpened: boolean
  refreshingBrowsers: Promise<FoundBrowser[]> | null
}

export interface WizardDataShape {
  chosenBundler: NexusGenEnums['SupportedBundlers'] | null
  allBundlers: typeof BUNDLERS
  chosenFramework: NexusGenEnums['FrontendFrameworkEnum'] | null
  chosenLanguage: NexusGenEnums['CodeLanguageEnum']
  chosenManualInstall: boolean
  chosenBrowser: FoundBrowser | null
}

export interface ElectronShape {
  browserWindow: BrowserWindow | null
}

export interface BaseErrorDataShape {
  title?: string
  message: string
  stack?: string
}

export interface CoreDataShape {
  baseError: BaseErrorDataShape | null
  dev: DevStateShape
  app: AppDataShape
  wizard: WizardDataShape
  user: AuthenticatedUserShape | null
  electron: ElectronShape
  hasIntializedMode: 'open' | 'run' | null
}

function makeCurrentProject (launchArgs: LaunchArgs): CurrentProjectShape | null {
  if (launchArgs.global || !launchArgs.projectRoot) {
    return null
  }

  return {
    title: path.basename(launchArgs.projectRoot),
    projectRoot: launchArgs.projectRoot,
    currentTestingType: launchArgs.testingType ?? null,
  }
}

/**
 * All state for the app should live here for now
 */
export function makeCoreData (launchArgs: LaunchArgs): CoreDataShape {
  return {
    hasIntializedMode: null,
    baseError: null,
    dev: {
      refreshState: null,
    },
    app: {
      refreshingBrowsers: null,
      navItem: 'settings',
      browsers: null,
      projects: [],
      currentProject: makeCurrentProject(launchArgs),
      isInGlobalMode: false,
      isAuthBrowserOpened: false,
    },
    wizard: {
      chosenBundler: null,
      chosenFramework: null,
      chosenLanguage: 'js',
      chosenManualInstall: false,
      allBundlers: BUNDLERS,
      chosenBrowser: null,
    },
    user: null,
    electron: {
      browserWindow: null,
    },
  }
}
