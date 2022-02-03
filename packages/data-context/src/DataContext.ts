import type { AllModeOptions } from '@packages/types'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util'
import chalk from 'chalk'
import assert from 'assert'
import s from 'underscore.string'

import 'server-destroy'

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
  EnvDataSource,
  GraphQLDataSource,
  HtmlDataSource,
  UtilDataSource,
  BrowserApiShape,
  MigrationDataSource,
} from './sources/'
import { cached } from './util/cached'
import type { GraphQLSchema } from 'graphql'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import type { App as ElectronApp } from 'electron'
import { VersionsDataSource } from './sources/VersionsDataSource'
import type { Socket, SocketIOServer } from '@packages/socket'
import { globalPubSub } from '.'
import { InjectedConfigApi, ProjectLifecycleManager } from './data/ProjectLifecycleManager'

const IS_DEV_ENV = process.env.CYPRESS_INTERNAL_ENV !== 'production'

export type Updater = (proj: CoreDataShape) => void | undefined | CoreDataShape

export type CurrentProjectUpdater = (proj: Exclude<CoreDataShape['currentProject'], null | undefined>) => void | undefined | CoreDataShape['currentProject']

export interface InternalDataContextOptions {
  loadCachedProjects: boolean
}

export interface ErrorApiShape {
  error: (type: string, ...args: any) => Error & { type: string, details: string, code?: string, isCypressErr: boolean}
  message: (type: string, ...args: any) => string
  warning: (type: string, ...args: any) => null
}

export interface DataContextConfig {
  schema: GraphQLSchema
  mode: 'run' | 'open'
  modeOptions: Partial<AllModeOptions>
  electronApp?: ElectronApp
  coreData?: CoreDataShape
  /**
   * Injected from the server
   */
  appApi: AppApiShape
  localSettingsApi: LocalSettingsApiShape
  authApi: AuthApiShape
  errorApi: ErrorApiShape
  configApi: InjectedConfigApi
  projectApi: ProjectApiShape
  electronApi: ElectronApiShape
  browserApi: BrowserApiShape
}

export class DataContext {
  private _config: Omit<DataContextConfig, 'modeOptions'>
  private _modeOptions: Readonly<Partial<AllModeOptions>>
  private _coreData: CoreDataShape
  readonly lifecycleManager: ProjectLifecycleManager

  constructor (_config: DataContextConfig) {
    const { modeOptions, ...rest } = _config

    this._config = rest
    this._modeOptions = modeOptions ?? {} // {} For legacy tests
    this._coreData = _config.coreData ?? makeCoreData(this._modeOptions)
    this.lifecycleManager = new ProjectLifecycleManager(this)
  }

  get isRunMode () {
    return this._config.mode === 'run'
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

  get modeOptions () {
    return this._modeOptions
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

  get nodePath () {
    return this.coreData.app.nodePath
  }

  get baseError () {
    if (!this.coreData.baseError) {
      return null
    }

    // TODO: Standardize approach to serializing errors
    return {
      title: this.coreData.baseError.title,
      message: this.coreData.baseError.message,
      stack: this.coreData.baseError.stack,
    }
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

  @cached
  get migration () {
    return new MigrationDataSource(this)
  }

  get projectsList () {
    return this.coreData.app.projects
  }

  // Servers

  setAppServerPort (port: number | undefined) {
    this.update((d) => {
      d.servers.appServerPort = port ?? null
    })
  }

  setAppSocketServer (socketServer: SocketIOServer | undefined) {
    this.update((d) => {
      if (d.servers.appSocketServer !== socketServer) {
        d.servers.appSocketServer?.off('connection', this.initialPush)
        socketServer?.on('connection', this.initialPush)
      }

      d.servers.appSocketServer = socketServer
    })
  }

  setGqlServer (srv: Server) {
    this.update((d) => {
      d.servers.gqlServer = srv
      d.servers.gqlServerPort = (srv.address() as AddressInfo).port
    })
  }

  setGqlSocketServer (socketServer: SocketIOServer | undefined) {
    this.update((d) => {
      if (d.servers.gqlSocketServer !== socketServer) {
        d.servers.gqlSocketServer?.off('connection', this.initialPush)
        socketServer?.on('connection', this.initialPush)
      }

      d.servers.gqlSocketServer = socketServer
    })
  }

  initialPush = (socket: Socket) => {
    // TODO: This is a hack that will go away when we refine the whole socket communication
    // layer w/ GraphQL subscriptions, we shouldn't be pushing so much
    setTimeout(() => {
      socket.emit('data-context-push')
    }, 100)
  }

  /**
   * This will be replaced with Immer, for immutable state updates.
   */
  update = (updater: Updater): void => {
    updater(this._coreData)
  }

  get appServerPort () {
    return this.coreData.servers.appServerPort
  }

  get gqlServerPort () {
    return this.coreData.servers.gqlServerPort
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
      browserApi: this._config.browserApi,
      configApi: this._config.configApi,
      projectApi: this._config.projectApi,
      errorApi: this._config.errorApi,
      electronApi: this._config.electronApi,
      localSettingsApi: this._config.localSettingsApi,
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

  private _debugCache: Record<string, debug.Debugger> = {}

  debugNs = (ns: string, evt: string, ...args: any[]) => {
    const _debug = this._debugCache[ns] ??= debugLib(`cypress:data-context:${ns}`)

    _debug(evt, ...args)
  }

  logTraceError (e: unknown) {
    // TODO(tim): handle this consistently
    // eslint-disable-next-line no-console
    console.error(e)
  }

  onError = (err: Error) => {
    if (this.isRunMode) {
      if (this.lifecycleManager?.runModeExitEarly) {
        this.lifecycleManager.runModeExitEarly(err)
      } else {
        throw err
      }
    } else {
      this.coreData.baseError = err
    }
  }

  onWarning = (err: { message: string, type?: string, details?: string }) => {
    if (this.isRunMode) {
      // eslint-disable-next-line
      console.log(chalk.yellow(err.message))
    } else {
      this.coreData.warnings.push({
        title: `Warning: ${s.titleize(s.humanize(err.type ?? ''))}`,
        message: err.message,
        details: err.details,
      })

      this.emitter.toLaunchpad()
    }
  }

  /**
   * If we really want to get around the guards added in proxyContext
   * which disallow referencing ctx.actions / ctx.emitter from context for a GraphQL query,
   * we can call ctx.deref.emitter, etc. This should only be used in exceptional situations where
   * we're certain this is a good idea.
   */
  get deref () {
    return this
  }

  async destroy () {
    const destroy = util.promisify(this.coreData.servers.gqlServer?.destroy || (() => {}))

    return Promise.all([
      destroy(),
      this._reset(),
    ])
  }

  get loader () {
    return this.util.loader
  }

  /**
   * Resets all of the state for the data context,
   * so we can initialize fresh for each E2E test
   */
  async resetForTest (modeOptions: Partial<AllModeOptions> = {}) {
    this.debug('DataContext resetForTest')
    if (!process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
      throw new Error(`DataContext.reset is only meant to be called in E2E testing mode, there's no good use for it outside of that`)
    }

    await this._reset()

    this._modeOptions = modeOptions
    this._coreData = makeCoreData(modeOptions)
    // @ts-expect-error - we've already cleaned up, this is for testing only
    this.lifecycleManager = new ProjectLifecycleManager(this)

    globalPubSub.emit('reset:data-context', this)
  }

  private _reset () {
    // this._gqlServer?.close()
    // this.emitter.destroy()
    // this._loadingManager.destroy()
    // this._loadingManager = new LoadingManager(this)
    // this.coreData.currentProject?.watcher
    // this._coreData = makeCoreData({}, this._loadingManager)
    this.setAppSocketServer(undefined)
    this.setGqlSocketServer(undefined)

    return Promise.all([
      this.lifecycleManager.destroy(),
      this.cloud.reset(),
      this.util.disposeLoaders(),
      this.actions.project.clearCurrentProject(),
      this.actions.dev.dispose(),
    ])
  }

  async initializeMode () {
    assert(!this.coreData.hasInitializedMode)
    this.coreData.hasInitializedMode = this._config.mode
    if (this._config.mode === 'run') {
      await this.lifecycleManager.initializeRunMode()
    } else if (this._config.mode === 'open') {
      await this.initializeOpenMode()
    } else {
      throw new Error(`Missing DataContext config "mode" setting, expected run | open`)
    }
  }

  error (type: string, ...args: any[]) {
    return this._apis.errorApi.error(type, ...args)
  }

  warning (type: string, ...args: any[]) {
    return this._apis.errorApi.error(type, ...args)
  }

  private async initializeOpenMode () {
    if (IS_DEV_ENV && !process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
      this.actions.dev.watchForRelaunch()
    }

    const toAwait: Promise<any>[] = [
      // load the cached user & validate the token on start
      this.actions.auth.getUser(),
      // and grab the user device settings
      this.actions.localSettings.refreshLocalSettings(),
    ]

    // load projects from cache on start
    toAwait.push(this.actions.project.loadProjects())

    if (this.modeOptions.testingType) {
      this.lifecycleManager.initializeConfig().catch((err) => {
        this.coreData.baseError = err
      })
    }

    return Promise.all(toAwait)
  }
}
