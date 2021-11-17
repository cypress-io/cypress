import type { LaunchArgs, OpenProjectLaunchOptions, PlatformName } from '@packages/types'
import fsExtra from 'fs-extra'
import path from 'path'

import { AppApiShape, DataEmitterActions, LocalSettingsApiShape, ProjectApiShape } from './actions'
import type { NexusGenAbstractTypeMembers } from '@packages/graphql/src/gen/nxs.gen'
import type { AuthApiShape } from './actions/AuthActions'
import type { ElectronApiShape } from './actions/ElectronActions'
import debugLib from 'debug'
import { CoreDataShape, makeCoreData } from './data/coreDataShape'
import { DataActions } from './DataActions'
import {
  GitDataSource,
  FileDataSource,
  ProjectDataSource,
  WizardDataSource,
  BrowserDataSource,
  StorybookDataSource,
  CloudDataSource,
  ProjectConfigDataSource,
  EnvDataSource,
  GraphQLDataSource,
  HtmlDataSource,
  UtilDataSource,
  LocalSettingsSource,
} from './sources/'
import { cached } from './util/cached'
import type { GraphQLSchema } from 'graphql'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import EventEmitter from 'events'
import type { App as ElectronApp } from 'electron'
import { VersionsDataSource } from './sources/VersionsDataSource'

const IS_DEV_ENV = process.env.CYPRESS_INTERNAL_ENV !== 'production'

export interface InternalDataContextOptions {
  loadCachedProjects: boolean
}

export interface DataContextConfig {
  schema: GraphQLSchema
  os: PlatformName
  launchArgs: LaunchArgs
  launchOptions: OpenProjectLaunchOptions
  electronApp?: ElectronApp
  /**
   * Default is to
   */
  coreData?: CoreDataShape
  /**
   * Injected from the server
   */
  appApi: AppApiShape
  localSettingsApi: LocalSettingsApiShape
  authApi: AuthApiShape
  projectApi: ProjectApiShape
  electronApi: ElectronApiShape
  /**
   * Internal options used for testing purposes
   */
  _internalOptions: InternalDataContextOptions
}

export class DataContext {
  private _rootBus: EventEmitter
  private _coreData: CoreDataShape
  private _gqlServer?: Server
  private _appServerPort: number | undefined
  private _gqlServerPort: number | undefined

  constructor (private _config: DataContextConfig) {
    this._rootBus = new EventEmitter()
    this._coreData = _config.coreData ?? makeCoreData()
  }

  get electronApp () {
    return this._config.electronApp
  }

  get electronApi () {
    return this._config.electronApi
  }

  get localSettingsApi () {
    return this._config.localSettingsApi
  }

  get isGlobalMode () {
    return !this.currentProject
  }

  async initializeData () {
    const toAwait: Promise<any>[] = [
      // Fetch the browsers when the app starts, so we have some by
      // the time we're continuing.
      this.actions.app.refreshBrowsers(),
      // load the cached user & validate the token on start
      this.actions.auth.getUser(),
      // and grab the user device settings
      this.actions.localSettings.refreshLocalSettings(),
      this.actions.app.refreshNodePathAndVersion(),
    ]

    if (this._config._internalOptions.loadCachedProjects) {
      // load projects from cache on start
      toAwait.push(this.actions.project.loadProjects())
    }

    if (this._config.launchArgs.projectRoot) {
      await this.actions.project.setActiveProject(this._config.launchArgs.projectRoot)

      if (this.coreData.currentProject?.preferences) {
        toAwait.push(this.actions.project.launchProjectWithoutElectron())
      }
    }

    if (this._config.launchArgs.testingType) {
      this.appData.currentTestingType = this._config.launchArgs.testingType
      // It should be possible to skip the first step in the wizard, if the
      // user already told us the testing type via command line argument
      this.actions.wizard.setTestingType(this._config.launchArgs.testingType)
      this.actions.wizard.navigate('forward')
    }

    if (this._config.launchArgs.browser) {
      toAwait.push(this.actions.app.setActiveBrowserByNameOrPath(this._config.launchArgs.browser))
    }

    if (IS_DEV_ENV) {
      this.actions.dev.watchForRelaunch()
    }

    return Promise.all(toAwait)
  }

  get rootBus () {
    return this._rootBus
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

  get nodePathAndVersion () {
    return this.coreData.app.nodePathAndVersion
  }

  get baseError () {
    return this.coreData.baseError
  }

  @cached
  get file () {
    return new FileDataSource(this)
  }

  @cached
  get localSettings () {
    return new LocalSettingsSource(this)
  }

  @cached
  get git () {
    return new GitDataSource(this)
  }

  async versions () {
    return new VersionsDataSource().versions()
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

  get appData () {
    return this.coreData.app
  }

  @cached
  get wizard () {
    return new WizardDataSource(this)
  }

  @cached
  get config () {
    return new ProjectConfigDataSource(this)
  }

  @cached
  get storybook () {
    return new StorybookDataSource(this)
  }

  get wizardData () {
    return this.coreData.wizard
  }

  get currentProject () {
    return this.coreData.currentProject
  }

  @cached
  get project () {
    return new ProjectDataSource(this)
  }

  @cached
  get cloud () {
    return new CloudDataSource(this)
  }

  @cached
  get env () {
    return new EnvDataSource(this)
  }

  @cached
  get emitter () {
    return new DataEmitterActions(this)
  }

  graphqlClient () {
    return new GraphQLDataSource(this, this._config.schema)
  }

  @cached
  get html () {
    return new HtmlDataSource(this)
  }

  @cached
  get util () {
    return new UtilDataSource(this)
  }

  get projectsList () {
    return this.coreData.app.projects
  }

  // Servers

  setAppServerPort (port: number | undefined) {
    this._appServerPort = port
  }

  setGqlServer (srv: Server) {
    this._gqlServer = srv
    this._gqlServerPort = (srv.address() as AddressInfo).port
  }

  get appServerPort () {
    return this._appServerPort
  }

  get gqlServerPort () {
    return this._gqlServerPort
  }

  // Utilities

  @cached
  get fs () {
    return fsExtra
  }

  @cached
  get path () {
    return path
  }

  get _apis () {
    return {
      appApi: this._config.appApi,
      authApi: this._config.authApi,
      projectApi: this._config.projectApi,
      electronApi: this._config.electronApi,
      localSettingsApi: this._config.localSettingsApi,
      busApi: this._rootBus,
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
    this._gqlServer?.close()

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
