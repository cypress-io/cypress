import type { LaunchArgs, OpenProjectLaunchOptions, PlatformName } from '@packages/types'
import type { AppApiShape, ProjectApiShape } from './actions'
import type { NexusGenAbstractTypeMembers } from '@packages/graphql/src/gen/nxs.gen'
import type { AuthApiShape } from './actions/AuthActions'
import type { ElectronApiShape } from './actions/ElectronActions'
import debugLib from 'debug'
import { CoreDataShape, makeCoreData } from './data/coreDataShape'
import { DataActions } from './DataActions'
import {
  AppDataSource,
  GitDataSource,
  FileDataSource,
  ProjectDataSource,
  WizardDataSource,
  BrowserDataSource,
  StorybookDataSource,
  CloudDataSource,
  ConfigDataSource,
} from './sources/'
import { cached } from './util/cached'
import { DataContextShell, DataContextShellConfig } from './DataContextShell'
import type { GraphQLSchema } from 'graphql'
import type { App as ElectronApp } from 'electron'

const IS_DEV_ENV = process.env.CYPRESS_INTERNAL_ENV !== 'production'

export interface InternalDataContextOptions {
  loadCachedProjects: boolean
}

export interface DataContextConfig extends DataContextShellConfig {
  schema: GraphQLSchema
  os: PlatformName
  launchArgs: LaunchArgs
  launchOptions: OpenProjectLaunchOptions
  electronApp: ElectronApp
  /**
   * Default is to
   */
  coreData?: CoreDataShape
  /**
   * Injected from the server
   */
  appApi: AppApiShape
  authApi: AuthApiShape
  projectApi: ProjectApiShape
  electronApi: ElectronApiShape
  /**
   * Internal options used for testing purposes
   */
  _internalOptions: InternalDataContextOptions
}

export class DataContext extends DataContextShell {
  private _coreData: CoreDataShape

  constructor (private _config: DataContextConfig) {
    super(_config)
    this._coreData = _config.coreData ?? makeCoreData()
  }

  get electronApp () {
    return this._config.electronApp
  }

  get electronApi () {
    return this._config.electronApi
  }

  async initializeData () {
    const toAwait: Promise<any>[] = [
      // Fetch the browsers when the app starts, so we have some by
      // the time we're continuing.
      this.actions.app.refreshBrowsers(),
      // load the cached user & validate the token on start
      this.actions.auth.getUser(),
    ]

    if (this._config._internalOptions.loadCachedProjects) {
      // load projects from cache on start
      toAwait.push(this.actions.project.loadProjects())
    }

    if (this._config.launchArgs.projectRoot) {
      await this.actions.project.setActiveProject(this._config.launchArgs.projectRoot)

      if (this.coreData.app.activeProject?.preferences) {
        toAwait.push(this.actions.project.launchProjectWithoutElectron())
      }
    }

    if (this._config.launchArgs.testingType) {
      // It should be possible to skip the first step in the wizard, if the
      // user already told us the testing type via command line argument
      this.actions.wizard.setTestingType(this._config.launchArgs.testingType)
      this.actions.wizard.navigate('forward')
    }

    if (IS_DEV_ENV) {
      this.actions.dev.watchForRelaunch()
    }

    return Promise.all(toAwait)
  }

  get os () {
    return this._config.os
  }

  get launchArgs () {
    return this._config.launchArgs
  }

  get launchOptions () {
    return this._config.launchOptions
  }

  get coreData () {
    return this._coreData
  }

  get user () {
    return this.coreData.user
  }

  get browserList () {
    return this.coreData.app.browsers
  }

  get baseError () {
    return this.coreData.baseError
  }

  @cached
  get file () {
    return new FileDataSource(this)
  }

  @cached
  get git () {
    return new GitDataSource(this)
  }

  @cached
  get browser () {
    return new BrowserDataSource(this)
  }

  /**
   * All mutations (update / delete / create), fs writes, etc.
   * should run through this namespace. Everything else should be a "getter"
   */
  @cached
  get actions () {
    return new DataActions(this)
  }

  @cached
  get app () {
    return new AppDataSource(this)
  }

  get appData () {
    return this.coreData.app
  }

  @cached
  get wizard () {
    return new WizardDataSource(this)
  }

  @cached
  get config () {
    return new ConfigDataSource(this)
  }

  @cached
  get storybook () {
    return new StorybookDataSource(this)
  }

  get wizardData () {
    return this.coreData.wizard
  }

  get activeProject () {
    return this.coreData.app.activeProject
  }

  @cached
  get project () {
    return new ProjectDataSource(this)
  }

  @cached
  get cloud () {
    return new CloudDataSource(this)
  }

  get projectsList () {
    return this.coreData.app.projects
  }

  get _apis () {
    return {
      appApi: this._config.appApi,
      authApi: this._config.authApi,
      projectApi: this._config.projectApi,
      busApi: this._config.rootBus,
      electronApi: this._config.electronApi,
    }
  }

  makeId<T extends NexusGenAbstractTypeMembers['Node']> (typeName: T, nodeString: string) {
    return Buffer.from(`${typeName}:${nodeString}`).toString('base64')
  }

  // TODO(tim): type check
  fromId (str: string, accepted: NexusGenAbstractTypeMembers['Node']): string {
    const result = Buffer.from(str, 'base64').toString('utf-8')

    const [type, val] = result.split(':') as [string, string]

    if (type !== accepted) {
      throw new Error(`Expecting node with type ${accepted} saw ${type}`)
    }

    return val
  }

  debug = debugLib('cypress:data-context')

  logError (e: unknown) {
    // TODO(tim): handle this consistently
    // eslint-disable-next-line no-console
    console.error(e)
  }

  /**
   * If we really want to get around the guards added in proxyContext
   * which disallow referencing ctx.actions / ctx.emitter from contexct for a GraphQL query,
   * we can call ctx.deref.emitter, etc. This should only be used in exceptional situations where
   * we're certain this is a good idea.
   */
  get deref () {
    return this
  }

  async destroy () {
    super.destroy()

    return Promise.all([
      this.util.disposeLoaders(),
      this.actions.project.clearActiveProject(),
      this.actions.dev.dispose(),
    ])
  }

  get loader () {
    return this.util.loader
  }
}
