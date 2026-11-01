import type { AllModeOptions } from '@packages/types'
import fsExtra from 'fs-extra'
import path from 'path'
import { stripVTControlCharacters } from 'util'
import chalk from 'chalk'
import assert from 'assert'
import str from 'underscore.string'
import _ from 'lodash'

import 'server-destroy'

import { DataEmitterActions } from './actions'
import type { AppApiShape, CohortsApiShape, LocalSettingsApiShape, ProjectApiShape } from './actions'
import type { NexusGenAbstractTypeMembers } from './gen/nxs.gen'
import type { AuthApiShape } from './actions/AuthActions'
import type { ElectronApiShape } from './actions/ElectronActions'
import debugLib from 'debug'
import { makeCoreData } from './data/coreDataShape'
import type { CoreDataShape } from './data/coreDataShape'
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
  RelevantRunsDataSource,
  RelevantRunSpecsDataSource,
  VersionsDataSource,
  ErrorDataSource,
  GraphQLDataSource,
  RemoteRequestDataSource,
} from './sources'
import type { BrowserApiShape } from './sources'
import type { GraphQLSchema, OperationTypeNode, DocumentNode } from 'graphql'
import type { IncomingHttpHeaders } from 'http'
// tslint:disable-next-line no-implicit-dependencies - electron dep needs to be defined
import type { App as ElectronApp } from 'electron'
import { globalPubSub } from '.'
import { ProjectLifecycleManager } from './data/ProjectLifecycleManager'
import { logError } from '@packages/stderr-filtering'
import type { CypressError } from '@packages/errors'
import { resetIssuedWarnings } from '@packages/config'

const IS_DEV_ENV = process.env.CYPRESS_INTERNAL_ENV !== 'production'

type Updater = (proj: CoreDataShape) => void | undefined | CoreDataShape

// A Cypress error keeps the first paragraph in `message` and the rest, such as the
// stack trace of a config file that failed to load, in `details`. An error that did not
// come from a template has only its stack to say where it came from.
const formatForOutput = (err: CypressError) => {
  if (!err.isCypressErr && err.stack) {
    return err.stack
  }

  const message = err.message ?? String(err)

  return err.details ? `${message}\n\n${err.details}` : message
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
    logError(e)
  }

  // The error on display that the record was written for, so dismissing some other error leaves the record alone
  private _loadErrorIdForTap: string | null = null

  get loadErrorIdForTap () {
    return this._loadErrorIdForTap
  }

  /**
   * Records that the project could not load, for `cypress tap status` to report when the
   * project never starts a session. Only errors that stop the project from starting belong
   * here, which is why `onError`, also used for errors from a project that is running
   * normally, does not call it. Without a project there is nothing for a session to describe.
   */
  reportLoadErrorToTap (error: CypressError | string) {
    const projectRoot = this.currentProject

    if (!this.isOpenMode || !projectRoot) {
      return
    }

    // A message with no error behind it has nothing on display to dismiss
    this._loadErrorIdForTap = typeof error === 'string' ? null : this.coreData.diagnostics?.error?.id ?? null

    this._apis.projectApi.setSessionLoadError({
      projectRoot,
      testingType: this.coreData.currentTestingType,
      loadError: stripVTControlCharacters(typeof error === 'string' ? error : formatForOutput(error)),
    }).catch((err) => this.debug('could not record the load error for cypress tap: %o', err))
  }

  /**
   * Withdraws the record of a load error once the error has been dismissed or the project
   * is loading again, so `cypress tap status` does not keep reporting it.
   */
  clearLoadErrorForTap () {
    if (!this.isOpenMode) {
      return
    }

    this._loadErrorIdForTap = null

    this._apis.projectApi.clearSessionLoadError().catch((err) => this.debug('could not clear the load error for cypress tap: %o', err))
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

      // The Launchpad only shows this error to a person looking at its window, so
      // print it for a caller reading the process output. A repeat of the error
      // already on display is skipped, since one failed load can report it
      // several times.
      const shown = this.coreData.diagnostics?.error?.cypressError

      if (!shown || formatForOutput(shown) !== formatForOutput(cypressError)) {
        logError(formatForOutput(cypressError))
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

      if (!this.coreData.diagnostics.warnings.some((existing) => formatForOutput(existing.cypressError) === formatForOutput(err))) {
        logError(formatForOutput(err))
      }

      this.update((d) => {
        d.diagnostics.warnings.push(warning)
      })

      this.emitter.errorWarningChange()
    }
  }

  async destroy () {
    // Close graphql-ws clients and the GQL HTTP server before lifecycle teardown so
    // in-flight GraphQL/subscription work does not write to sockets mid-destroy (ERR_STREAM_DESTROYED).
    await this.actions.servers.destroyGqlServer()
    await this._reset()
  }

  /**
   * Resets all of the state for the data context,
   * so we can initialize fresh for each E2E test
   */
  async reinitializeCypress (modeOptions: Partial<AllModeOptions> = {}) {
    await this._reset()

    this._modeOptions = modeOptions
    this._coreData = makeCoreData(modeOptions)
    // DataActions is created once in the constructor and is not rebuilt here, so
    // its launch counter has to be reset explicitly or it leaks between tests
    this.actions.project.launchCount = 0
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
