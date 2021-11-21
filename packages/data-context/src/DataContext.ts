import type { LaunchArgs, OpenProjectLaunchOptions, PlatformName } from '@packages/types'
import fsExtra from 'fs-extra'
import path from 'path'
import Bluebird from 'bluebird'
import 'server-destroy'

import { AppApiShape, ApplicationDataApiShape, DataEmitterActions, LocalSettingsApiShape, ProjectApiShape } from './actions'
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
} from './sources/'
import { cached } from './util/cached'
import type { GraphQLSchema } from 'graphql'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import EventEmitter from 'events'
import type { App as ElectronApp } from 'electron'
import type { SocketIOServer } from '@packages/socket'
import { VersionsDataSource } from './sources/VersionsDataSource'

const IS_DEV_ENV = process.env.CYPRESS_INTERNAL_ENV !== 'production'

export interface DataContextConfig {
  mode: 'open' | 'run'
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
  appDataApi: ApplicationDataApiShape
  localSettingsApi: LocalSettingsApiShape
  authApi: AuthApiShape
  projectApi: ProjectApiShape
  electronApi: ElectronApiShape
}

export class DataContext {
  private _rootBus: EventEmitter
  private _coreData: CoreDataShape
  private _gqlServer: Server | undefined
  private _gqlSocketServer: SocketIOServer | undefined
  private _appServerPort: number | undefined
  private _appSocketServer: SocketIOServer | undefined
  private _gqlServerPort: number | undefined

  constructor (private _config: DataContextConfig) {
    this._rootBus = new EventEmitter()
    this._coreData = _config.coreData ?? makeCoreData(_config.launchArgs)

    if (IS_DEV_ENV) {
      this.actions.dev.watchForRelaunch()
    }
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
  resetLaunchArgs (launchArgs: LaunchArgs) {
    this._coreData = makeCoreData(launchArgs)
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
    return this.coreData.app.machineBrowsers
  }

  get nodePath () {
    return this.coreData.app.nodePath
  }

  @cached
  get file () {
    return new FileDataSource(this)
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
  get actions () {
    return new DataActions(this)
  }

  get appData () {
    return this.coreData.app
  }

  get wizard () {
    return new WizardDataSource(this)
  }

  get config () {
    return new ProjectConfigDataSource(this)
  }

  get storybook () {
    return new StorybookDataSource(this)
  }

  get wizardData () {
    return this.coreData.wizard
  }

  get currentProject () {
    return this.coreData.currentProject
  }

  get currentTestingType () {
    return this.coreData.currentProject?.currentTestingType ?? null
  }

  @cached
  get project () {
    return new ProjectDataSource(this)
  }

  get cloud () {
    return new CloudDataSource(this)
  }

  get env () {
    return new EnvDataSource(this)
  }

  get emitter () {
    return new DataEmitterActions(this, {
      gqlSocketServer: this._gqlSocketServer,
      appSocketServer: this._appSocketServer,
    })
  }

  graphqlClient () {
    return new GraphQLDataSource(this, this._config.schema)
  }

  get html () {
    return new HtmlDataSource(this)
  }

  @cached
  get util () {
    return new UtilDataSource(this)
  }

  get projectsList () {
    return this.coreData.globalProjects?.map((p) => {
      return {
        title: this.project.projectTitle(p),
        projectRoot: p,
      }
    }) ?? null
  }

  // Servers

  setAppSocketServer (socketServer: SocketIOServer | undefined) {
    this._appSocketServer = socketServer
  }

  setAppServerPort (port: number | undefined) {
    this._appServerPort = port
  }

  setGqlServer (srv: Server) {
    this._gqlServer = srv
    this._gqlServerPort = (srv.address() as AddressInfo).port
  }

  setGqlSocketServer (socketServer: SocketIOServer | undefined) {
    this._gqlSocketServer = socketServer
  }

  get appServerPort () {
    return this._appServerPort
  }

  get gqlServerPort () {
    return this._gqlServerPort
  }

  // Utilities

  get fs () {
    return fsExtra
  }

  get path () {
    return path
  }

  get _apis () {
    return {
      appApi: this._config.appApi,
      appDataApi: this._config.appDataApi,
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

  /**
   * Convert an error into a plain object
   */
  prepError (err: Error, title = 'Something went wrong') {
    return {
      title,
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
  }

  async destroy () {
    this.debug('DataContext destroy')

    await this.destroyServers()

    return Promise.all([
      this.util.disposeLoaders(),
      this.actions.currentProject?.clearCurrentProject(),
      this.actions.dev.dispose(),
    ])
  }

  private destroyServers () {
    this._gqlSocketServer?.disconnectSockets(true)
    // causes: Error: SocketCt#startListening must first be called before accessing 'this.io' while testing
    // this._appSocketServer?.disconnectSockets(true)

    return Promise.all([
      Bluebird.fromCallback((cb) => this._gqlServer ? this._gqlServer.destroy(cb) : cb(null)),
      // Bluebird.fromCallback((cb) => this._gqlSocketServer ? this._gqlSocketServer.close(cb) : cb(null)),
    ])
  }

  get loader () {
    return this.util.loader
  }

  async initializeMode () {
    // this.actions.app.refreshNodePath()
    if (this._config.mode === 'run') {
      await this.initializeRunMode()
    } else if (this._config.mode === 'open') {
      await this.initializeOpenMode()
    }
  }

  /**
   * Any work that's necessary to initialize the context for run mode
   */
  private async initializeRunMode () {
    if (this._coreData.hasIntializedMode) {
      throw new Error(`Mode already initialized`)
    }

    this._coreData.hasIntializedMode = 'run'
    // TODO: figure out what this needs to be... sourcing & validating config?
  }

  /**
   * After we set the launch args, we call this to "initialize" open mode.
   * This kicks off any data initialization we need to do before the app
   * is ready to go, and includes launching the server
   */
  private async initializeOpenMode () {
    if (this._coreData.hasIntializedMode) {
      throw new Error(`Mode already initialized`)
    }

    this.debug('initializeOpenMode: coreData', this._coreData)

    this._coreData.hasIntializedMode = 'open'

    const toAwait: Array<Promise<any> | undefined> = []

    // Load the cached user & validate the token on start
    this.actions.auth.getUser()

    // Fetch the machine browsers right when the app starts, so we have some by
    // the time we're attempting to source the project
    toAwait.push(this.actions.app.loadMachineBrowsers())

    // If there's no "current" project, we just want to launch global mode,
    // which involves sourcing the current projects.
    if (!this.currentProject) {
      toAwait.push(this.actions.globalProject.loadGlobalProjects())
    } else if (this.currentProject?.currentTestingType) {
      // Otherwise, if we know the testing type we want to
      // which will kick off the process of sourcing the config, if we have
      // a config file for this project
      toAwait.push(this.actions.currentProject?.loadConfigAndPlugins())
    }

    // this.actions.currentProject?.launchProjectWithoutElectron()
    return Promise.all(toAwait)
  }
}
