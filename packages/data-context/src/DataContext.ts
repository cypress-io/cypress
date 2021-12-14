import type { AllModeOptions } from '@packages/types'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util'

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
import type { App as ElectronApp } from 'electron'
import { VersionsDataSource } from './sources/VersionsDataSource'
import type { SocketIOServer } from '@packages/socket'
import { globalPubSub } from '.'

const IS_DEV_ENV = process.env.CYPRESS_INTERNAL_ENV !== 'production'

export type Updater = (proj: CoreDataShape) => void | undefined | CoreDataShape

export interface InternalDataContextOptions {
  loadCachedProjects: boolean
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
  projectApi: ProjectApiShape
  electronApi: ElectronApiShape
}

export class DataContext {
  private _config: Omit<DataContextConfig, 'modeOptions'>
  private _modeOptions: Readonly<Partial<AllModeOptions>>
  private _coreData: CoreDataShape

  constructor (_config: DataContextConfig) {
    const { modeOptions, ...rest } = _config

    this._config = rest
    this._modeOptions = modeOptions
    this._coreData = _config.coreData ?? makeCoreData(this._modeOptions)
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

  async initializeData () {

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
    this.update((d) => {
      d.servers.appServerPort = port ?? null
    })
  }

  setAppSocketServer (socketServer: SocketIOServer | undefined) {
    this.update((d) => {
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
      d.servers.gqlSocketServer = socketServer
    })
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
      projectApi: this._config.projectApi,
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
    globalPubSub.emit('reset:data-context', this)
  }

  private _reset () {
    // this._gqlServer?.close()
    // this.emitter.destroy()
    // this._loadingManager.destroy()
    // this._loadingManager = new LoadingManager(this)
    // this.coreData.currentProject?.watcher
    // this._coreData = makeCoreData({}, this._loadingManager)
    // this._patches = []
    // this._patches.push([{ op: 'add', path: [], value: this._coreData }])

    return Promise.all([
      this.cloud.reset(),
      this.util.disposeLoaders(),
      this.actions.project.clearActiveProject(),
      // this.actions.currentProject?.clearCurrentProject(),
      this.actions.dev.dispose(),
    ])
  }

  async initializeMode () {
    if (this._config.mode === 'run') {
      await this.actions.app.refreshBrowsers()
    } else if (this._config.mode === 'open') {
      await this.initializeOpenMode()
    } else {
      throw new Error(`Missing DataContext config "mode" setting, expected run | open`)
    }
  }

  error (type: string, ...args: any[]) {
    throw this._apis.projectApi.error.throw(type, ...args)
  }

  private async initializeOpenMode () {
    if (IS_DEV_ENV && !process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
      this.actions.dev.watchForRelaunch()
    }

    const toAwait: Promise<any>[] = [
      // Fetch the browsers when the app starts, so we have some by
      // the time we're continuing.
      this.actions.app.refreshBrowsers(),
      // load the cached user & validate the token on start
      this.actions.auth.getUser(),
      // and grab the user device settings
      this.actions.localSettings.refreshLocalSettings(),
    ]

    // load projects from cache on start
    toAwait.push(this.actions.project.loadProjects())

    if (this.modeOptions.projectRoot) {
      await this.actions.project.setActiveProject(this.modeOptions.projectRoot)

      if (this.coreData.currentProject?.preferences) {
        // Skipping this until we sort out the lifecycle things
        // toAwait.push(this.actions.project.launchProjectWithoutElectron())
      }
    }

    if (this.modeOptions.testingType) {
      this.appData.currentTestingType = this.modeOptions.testingType
      // It should be possible to skip the first step in the wizard, if the
      // user already told us the testing type via command line argument
      this.actions.wizard.setTestingType(this.modeOptions.testingType)
      this.actions.wizard.navigate('forward')
      this.emitter.toLaunchpad()
    }

    if (this.modeOptions.browser) {
      toAwait.push(this.actions.app.setActiveBrowserByNameOrPath(this.modeOptions.browser))
    }

    return Promise.all(toAwait)
  }

  // async initializeRunMode () {
  //   if (this._coreData.hasInitializedMode) {
  //     throw new Error(`
  //       Mode already initialized. If this is a test context, be sure to call
  //       resetForTest in a setup hook (before / beforeEach).
  //     `)
  //   }

  //   this.coreData.hasInitializedMode = 'run'

  //   const project = this.project

  //   if (!project || !project.configFilePath || !this.actions.currentProject) {
  //     throw this.error('NO_PROJECT_FOUND_AT_PROJECT_ROOT', project?.projectRoot ?? '(unknown)')
  //   }

  //   if (project.needsCypressJsonMigration) {
  //     throw this.error('CONFIG_FILE_MIGRATION_NEEDED', project.projectRoot)
  //   }

  //   if (project.hasLegacyJson) {
  //     this._apis.appApi.warn('LEGACY_CONFIG_FILE', project.configFilePath)
  //   }

  //   if (project.hasMultipleConfigPaths) {
  //     this._apis.appApi.warn('CONFIG_FILES_LANGUAGE_CONFLICT', project.projectRoot, ...project.nonJsonConfigPaths)
  //   }

  //   if (!project.currentTestingType) {
  //     throw this.error('TESTING_TYPE_NEEDED_FOR_RUN')
  //   }
  // }
}
