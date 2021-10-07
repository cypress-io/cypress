import type { LaunchArgs, OpenProjectLaunchOptions, PlatformName } from '@packages/types'
import debugLib from 'debug'
import fsExtra from 'fs-extra'
import type { AuthApiShape } from './actions/AuthActions'
import { CoreDataShape, makeCoreData } from './data/coreDataShape'
import { DataActions } from './DataActions'
import { AppDataSource } from './sources/AppDataSource'
import { ProjectDataSource } from './sources/ProjectDataSource'
import { cached } from './util/cached'
import { WizardDataSource } from './sources'
import type { AppApiShape, ProjectApiShape } from './actions'
import { makeLoaders } from './data/loaders'
import { BrowserDataSource } from './sources/BrowserDataSource'
import type { NexusGenAbstractTypeMembers } from '@packages/graphql/src/gen/nxs.gen'
import { DataContextShell, DataContextShellConfig } from './DataContextShell'

export interface DataContextConfig extends DataContextShellConfig {
  os: PlatformName
  launchArgs: LaunchArgs
  launchOptions: OpenProjectLaunchOptions
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
}

export class DataContext extends DataContextShell {
  private _coreData: CoreDataShape

  @cached
  get fs () {
    return fsExtra
  }

  constructor (private config: DataContextConfig) {
    super(config)
    this._coreData = config.coreData ?? makeCoreData()
  }

  loaders = makeLoaders(this)

  async initializeData () {
    const toAwait: Promise<any>[] = [
      // Fetch the browsers when the app starts, so we have some by
      // the time we're continuing.
      this.actions.app.refreshBrowsers(),
      // load projects from cache on start
      this.actions.project.loadProjects(),
    ]

    if (this.config.launchArgs.projectRoot) {
      toAwait.push(this.actions.project.setActiveProject(this.config.launchArgs.projectRoot))
    }

    return Promise.all(toAwait)
  }

  get os () {
    return this.config.os
  }

  get launchArgs () {
    return this.config.launchArgs
  }

  get launchOptions () {
    return this.config.launchOptions
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

  get projectsList () {
    return this.coreData.app.projects
  }

  get _apis () {
    return {
      appApi: this.config.appApi,
      authApi: this.config.authApi,
      projectApi: this.config.projectApi,
      busApi: this.config.rootBus,
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

  dispose () {
    this.loaders.dispose()
  }
}
