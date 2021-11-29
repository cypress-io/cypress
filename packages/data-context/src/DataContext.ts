import type { CypressError, CypressErrorLike, LaunchArgs, PlatformName } from '@packages/types'
import fsExtra from 'fs-extra'
import path from 'path'
import Bluebird from 'bluebird'
import { Immutable, Draft, produceWithPatches, Patch, enablePatches } from 'immer'
import 'server-destroy'
import { AppApiShape, ApplicationDataApiShape, DataEmitterActions, LegacyOpenProjectShape, LocalSettingsApiShape, ProjectApiShape } from './actions'
import type { NexusGenAbstractTypeMembers } from '@packages/graphql/src/gen/nxs.gen'
import type { AuthApiShape } from './actions/AuthActions'
import type { ElectronApiShape } from './actions/ElectronActions'
import debugLib from 'debug'
import { CoreDataShape, makeCoreData, makeCurrentProject } from './data/coreDataShape'
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
import type { SocketIOServer } from '@packages/socket'
import { VersionsDataSource } from './sources/VersionsDataSource'
import { LoadingManager } from './data/LoadingManager'
import type { LoadingState } from './util'
import { DataFormatters } from './DataFormatters'

enablePatches()

const IS_DEV_ENV = process.env.CYPRESS_INTERNAL_ENV !== 'production'

export interface DataContextConfig {
  mode: 'open' | 'run'
  schema: GraphQLSchema
  os?: PlatformName
  launchArgs?: Partial<LaunchArgs>
  apis: {
    appApi: AppApiShape
    appDataApi: ApplicationDataApiShape
    localSettingsApi: LocalSettingsApiShape
    authApi: AuthApiShape
    projectApi: ProjectApiShape
    electronApi: ElectronApiShape
  }
}

export class DataContext {
  private _rootBus: EventEmitter
  private _coreData: Immutable<CoreDataShape>
  private _patches: Patch[][] = []
  private _gqlServer: Server | undefined
  private _gqlSocketServer: SocketIOServer | undefined
  private _appServerPort: number | undefined
  private _appSocketServer: SocketIOServer | undefined
  private _gqlServerPort: number | undefined
  private _loadingManager: LoadingManager
  private _legacyOpenProject: LegacyOpenProjectShape | null = null

  constructor (private _config: DataContextConfig) {
    this._loadingManager = new LoadingManager(this)
    this._rootBus = new EventEmitter()
    this._coreData = makeCoreData(_config.launchArgs, this._loadingManager)

    if (IS_DEV_ENV) {
      this.actions.dev.watchForRelaunch()
    }
  }

  get legacyOpenProject () {
    if (!this._legacyOpenProject) {
      this._legacyOpenProject = this._apis.projectApi.makeLegacyOpenProject()
    }

    return this._legacyOpenProject
  }

  get loadingManager () {
    return this._loadingManager
  }

  get electronApp () {
    return this.coreData.electron.app
  }

  get electronApi () {
    return this._config.apis.electronApi
  }

  get localSettingsApi () {
    return this._config.apis.localSettingsApi
  }

  get isGlobalMode () {
    return !this.currentProject
  }

  get patches () {
    return this._patches
  }

  get formatters () {
    return new DataFormatters()
  }

  /**
   * Run all of the "updates" through a single method to track the timeline
   * of mutations for debuggability, testing, etc
   */
  update = (updater: (proj: Draft<CoreDataShape>) => void | undefined | CoreDataShape, throwError: boolean = false): void => {
    try {
      const [state, patches] = produceWithPatches(this._coreData, updater)

      this._coreData = state
      this._patches.push(patches)
    } catch (e) {
      if (throwError) {
        throw e
      }

      this.update((o) => {
        o.globalError = this.prepError(e)
      }, true)
    }
  }

  resetLaunchArgs (launchArgs: LaunchArgs) {
    this._coreData = makeCoreData(launchArgs, this._loadingManager)
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

  get coreData () {
    return this._coreData
  }

  get user () {
    return this.coreData.user
  }

  get browserList () {
    return this.coreData.machineBrowsers
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
    return this.coreData
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

  get currentProject () {
    return this.coreData.currentProject
  }

  get currentTestingType () {
    return this.coreData.currentProject?.currentTestingType ?? null
  }

  get project () {
    return this.currentProject ? new ProjectDataSource(this) : null
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
    if (this.coreData.globalProjects.state === 'LOADED') {
      return this.coreData.globalProjects.value.map((p) => {
        return {
          title: path.basename(p),
          projectRoot: p,
        }
      })
    }

    return null
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
    return this._config.apis
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
  prepError (err: CypressErrorLike | CypressError | Error & Record<string, any>, title = 'Something went wrong') {
    return {
      title,
      name: err.name,
      message: err.message,
      stack: err.stack,
      isCypressError: err.isCypressErr,
      details: err.details,
      code: err.code,
      errno: err.errno,
    }
  }

  setCurrentProject (projectRoot: string) {
    this.loadingManager.resetCurrentProject()
    this.update((o) => {
      o.currentProject = makeCurrentProject({ projectRoot }, this.loadingManager)
    })
  }

  /**
   * Resets all of the state for the data context,
   * so we can initialize fresh for each E2E test
   */
  resetForTest () {
    this.debug('DataContext resetForTest')
    if (!process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
      throw new Error(`DataContext.reset is only meant to be called in E2E testing mode, there's no good use for it outside of that`)
    }

    return this._reset()
  }

  isLoading<V> (val: LoadingState<V>): boolean {
    return val.state === 'LOADING'
  }

  /**
   * If there's an error with a "Loading Container" value, this unwraps it
   */
  loadingErr <V> (val: LoadingState<V>) {
    return val.state === 'ERRORED' ? this.prepError(val.error) : null
  }

  loadedVal <V> (val: LoadingState<V>): V | null {
    return val.state === 'LOADED' ? val.value : null
  }

  async destroy () {
    this.debug('DataContext destroy')

    await this.destroyServers()

    return this._reset()
  }

  private _reset () {
    this.emitter.destroy()
    this._loadingManager.destroy()
    this._loadingManager = new LoadingManager(this)
    this.coreData.currentProject?.watcher
    this._coreData = makeCoreData({}, this._loadingManager)
    this._patches = []

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
    this.emitter.init()

    if (this._config.mode === 'run') {
      await this.initializeRunMode()
    } else if (this._config.mode === 'open') {
      await this.initializeOpenMode()
    } else {
      throw new Error(`Missing DataContext config "mode" setting, expected run | open`)
    }
  }

  /**
   * Any work that's necessary to initialize the context for run mode
   */
  private async initializeRunMode () {
    if (this._coreData.hasIntializedMode) {
      throw new Error(`Mode already initialized`)
    }

    this.update((o) => {
      o.hasIntializedMode = 'run'
    })
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

    this.update((o) => {
      o.hasIntializedMode = 'open'
    })

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
