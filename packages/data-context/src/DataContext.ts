import type { AllModeOptions } from '@packages/types'
import fsExtra from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import assert from 'assert'
import str from 'underscore.string'
import _ from 'lodash'

import 'server-destroy'

import { AppApiShape, CohortsApiShape, DataEmitterActions, LocalSettingsApiShape, ProjectApiShape } from './actions'
import type { NexusGenAbstractTypeMembers } from '@packages/graphql/src/gen/nxs.gen'
import type { AuthApiShape } from './actions/AuthActions'
import type { ElectronApiShape } from './actions/ElectronActions'
import debugLib from 'debug'
import { CoreDataShape, makeCoreData } from './data/coreDataShape'
import { DataActions } from './DataActions'
import {
  FileDataSource,
  ProjectDataSource,
  WizardDataSource,
  BrowserDataSource,
  CloudDataSource,
  EnvDataSource,
  HtmlDataSource,
  UtilDataSource,
  BrowserApiShape,
  MigrationDataSource,
  RelevantRunsDataSource,
  RelevantRunSpecsDataSource,
  VersionsDataSource,
  ErrorDataSource,
  GraphQLDataSource,
  RemoteRequestDataSource,
} from './sources'
import type { GraphQLSchema, OperationTypeNode, DocumentNode } from 'graphql'
import type { IncomingHttpHeaders } from 'http'
// tslint:disable-next-line no-implicit-dependencies - electron dep needs to be defined
import type { App as ElectronApp } from 'electron'
import { globalPubSub } from '.'
import { ProjectLifecycleManager } from './data/ProjectLifecycleManager'
import type { CypressError } from '@packages/errors'
import { resetIssuedWarnings } from '@packages/config'

const IS_DEV_ENV = process.env.CYPRESS_INTERNAL_ENV !== 'production'

export type Updater = (proj: CoreDataShape) => void | undefined | CoreDataShape

export type CurrentProjectUpdater = (proj: Exclude<CoreDataShape['currentProject'], null | undefined>) => void | undefined | CoreDataShape['currentProject']

export interface InternalDataContextOptions {
  loadCachedProjects: boolean
}

export interface DataContextConfig {
  schema: GraphQLSchema
  schemaCloud: GraphQLSchema
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
  projectApi: ProjectApiShape
  electronApi: ElectronApiShape
  browserApi: BrowserApiShape
  cohortsApi: CohortsApiShape
}

export interface GraphQLRequestInfo {
  app: 'app' | 'launchpad'
  operationName: string | null
  document: DocumentNode
  operation: OperationTypeNode
  variables: Record<string, any> | null
  headers: IncomingHttpHeaders
}

export class DataContext {
  readonly graphqlRequestInfo?: GraphQLRequestInfo
  private _config: Omit<DataContextConfig, 'modeOptions'>
  private _modeOptions: Partial<AllModeOptions>
  private _coreData: CoreDataShape
  private _graphql: GraphQLDataSource
  private _remoteRequest: RemoteRequestDataSource
  private _file: FileDataSource
  private _versions: VersionsDataSource
  private _browser: BrowserDataSource
  private _actions: DataActions
  private _wizard: WizardDataSource
  private _project: ProjectDataSource
  private _relevantRuns: RelevantRunsDataSource
  private _relevantRunSpecs: RelevantRunSpecsDataSource
  private _cloud: CloudDataSource
  private _env: EnvDataSource
  private _emitter: DataEmitterActions
  private _html: HtmlDataSource
  private _error: ErrorDataSource
  private _util: UtilDataSource
  private _migration: MigrationDataSource

  readonly lifecycleManager: ProjectLifecycleManager

  constructor (_config: DataContextConfig) {
    const { modeOptions, ...rest } = _config

    this._config = rest
    this._modeOptions = modeOptions ?? {} // {} For legacy tests
    this._coreData = _config.coreData ?? makeCoreData(this._modeOptions)
    this._graphql = new GraphQLDataSource()
    this._remoteRequest = new RemoteRequestDataSource()
    this._file = new FileDataSource(this)
    this._versions = new VersionsDataSource(this)
    this._browser = new BrowserDataSource(this)
    this._actions = new DataActions(this)
    this._wizard = new WizardDataSource(this)
    this._project = new ProjectDataSource(this)
    this._relevantRuns = new RelevantRunsDataSource(this)
    this._relevantRunSpecs = new RelevantRunSpecsDataSource(this)
    this._cloud = new CloudDataSource({
      fetch: (input: RequestInfo | URL, init?: RequestInit) => this.util.fetch(input, init),
      getUser: () => this.coreData.user,
      logout: () => this.actions.auth.logout().catch(this.logTraceError),
      invalidateClientUrqlCache: () => this.graphql.invalidateClientUrqlCache(this),
      headers: {
        getMachineId: this.coreData.machineId,
      },
    })

    this._env = new EnvDataSource(this)
    this._emitter = new DataEmitterActions(this)
    this._html = new HtmlDataSource(this)
    this._error = new ErrorDataSource(this)
    this._util = new UtilDataSource(this)
    this._migration = new MigrationDataSource(this)
    // the lifecycle manager needs to be initialized last as it needs properties instantiated on the DataContext object
    this.lifecycleManager = new ProjectLifecycleManager(this)
  }

  get config () {
    return this._config
  }

  get git () {
    return this.coreData.currentProjectGitInfo
  }

  get isRunMode () {
    return this.config.mode === 'run'
  }

  get isOpenMode () {
    return !this.isRunMode
  }

  get graphql () {
    return this._graphql
  }

  get remoteRequest () {
    return this._remoteRequest
  }

  get modeOptions (): Readonly<Partial<AllModeOptions>> {
    return this._modeOptions
  }

  get coreData () {
    return this._coreData
  }

  get file () {
    return this._file
  }

  get versions () {
    return this._versions
  }

  get browser () {
    return this._browser
  }

  /**
   * All mutations (update / delete / create), fs writes, etc.
   * should run through this namespace. Everything else should be a "getter"
   */
  get actions () {
    return this._actions
  }

  get wizard () {
    return this._wizard
  }

  get currentProject () {
    return this.coreData.currentProject
  }

  get project () {
    return this._project
  }

  get relevantRuns () {
    return this._relevantRuns
  }

  get relevantRunSpecs () {
    return this._relevantRunSpecs
  }

  get cloud () {
    return this._cloud
  }
  get env () {
    return this._env
  }

  get emitter () {
    return this._emitter
  }

  get html () {
    return this._html
  }

  get error () {
    return this._error
  }

  get util () {
    return this._util
  }

  get migration () {
    return this._migration
  }

  /**
   * This will be replaced with Immer, for immutable state updates.
   */
  update = (updater: Updater): void => {
    updater(this._coreData)
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
      appApi: this.config.appApi,
      authApi: this.config.authApi,
      browserApi: this.config.browserApi,
      projectApi: this.config.projectApi,
      electronApi: this.config.electronApi,
      localSettingsApi: this.config.localSettingsApi,
      cohortsApi: this.config.cohortsApi,
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

  onError = (cypressError: CypressError, title: string = 'Unexpected Error') => {
    if (this.isRunMode) {
      if (this.lifecycleManager?.runModeExitEarly) {
        this.lifecycleManager.runModeExitEarly(cypressError)
      } else {
        throw cypressError
      }
    } else {
      const err = {
        id: _.uniqueId('Error'),
        title,
        cypressError,
      }

      this.update((d) => {
        if (d.diagnostics) {
          d.diagnostics.error = err
        }
      })

      this.emitter.errorWarningChange()
    }
  }

  onWarning = (err: CypressError) => {
    if (this.isRunMode) {
      // eslint-disable-next-line
      console.log(chalk.yellow(err.message))
    } else {
      const warning = {
        id: _.uniqueId('Warning'),
        title: `Warning: ${str.titleize(str.humanize(err.type ?? ''))}`,
        cypressError: err,
      }

      this.update((d) => {
        d.diagnostics.warnings.push(warning)
      })

      this.emitter.errorWarningChange()
    }
  }

  async destroy () {
    return Promise.all([
      this.actions.servers.destroyGqlServer(),
      this._reset(),
    ])
  }

  /**
   * Resets all of the state for the data context,
   * so we can initialize fresh for each E2E test
   */
  async reinitializeCypress (modeOptions: Partial<AllModeOptions> = {}) {
    await this._reset()

    this._modeOptions = modeOptions
    this._coreData = makeCoreData(modeOptions)
    // @ts-expect-error - we've already cleaned up, this is for testing only
    this.lifecycleManager = new ProjectLifecycleManager(this)

    globalPubSub.emit('reset:data-context', this)
  }

  _reset () {
    DataContext.#activeRequestCount = 0
    this.actions.servers.setAppSocketServer(undefined)
    this.actions.servers.setGqlSocketServer(undefined)

    resetIssuedWarnings()

    return Promise.all([
      this.lifecycleManager.destroy(),
      this.cloud.reset(),
      this.actions.project.clearCurrentProject(),
      this.actions.dev.dispose(),
    ])
  }

  async initializeMode () {
    assert(!this.coreData.hasInitializedMode)
    this.coreData.hasInitializedMode = this.config.mode
    if (this.config.mode === 'run') {
      await this.lifecycleManager.initializeRunMode(this.coreData.currentTestingType)
    } else if (this.config.mode === 'open') {
      await this.initializeOpenMode()
      await this.lifecycleManager.initializeOpenMode(this.coreData.currentTestingType)
    } else {
      throw new Error(`Missing DataContext config "mode" setting, expected run | open`)
    }
  }

  private async initializeOpenMode () {
    if (IS_DEV_ENV && !process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
      this.actions.dev.watchForRelaunch()
    }

    // We want to fetch the user immediately, but we don't need to block the UI on this
    this.actions.auth.getUser().catch((e) => {
      // This error should never happen, since it's internally handled by getUser
      // Log anyway, just incase
      this.logTraceError(e)
    })

    const toAwait: Promise<any>[] = [
      this.actions.localSettings.refreshLocalSettings(),
    ]

    // load projects from cache on start
    toAwait.push(this.actions.project.loadProjects())

    await Promise.all(toAwait)
  }

  static #activeRequestCount = 0
  static #awaitingEmptyRequestCount: Function[] = []

  static addActiveRequest () {
    this.#activeRequestCount++
  }

  static finishActiveRequest () {
    this.#activeRequestCount--

    if (this.#activeRequestCount === 0) {
      this.#awaitingEmptyRequestCount.forEach((fn) => fn())
      this.#awaitingEmptyRequestCount = []
    }
  }

  static async waitForActiveRequestsToFlush () {
    if (this.#activeRequestCount === 0) {
      return
    }

    return new Promise((resolve) => {
      this.#awaitingEmptyRequestCount.push(resolve)
    })
  }

  updateModeOptionsBrowser (browser: string) {
    this._modeOptions.browser = browser
  }
}
