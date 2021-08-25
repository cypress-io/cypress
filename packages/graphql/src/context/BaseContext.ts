import type { LaunchArgs } from '@packages/server/lib/open_project'
import type { OpenProjectLaunchOptions } from '@packages/server/lib/project-base'
import type { BaseActions } from '../actions/BaseActions'
import { App, Wizard, NavigationMenu, Project, Viewer } from '../entities'
import type { NexusGenArgTypes, NexusGenObjects } from '../gen/nxs.gen'

type CloudQueryArgs<M> = M extends keyof NexusGenArgTypes['CloudQuery'] ? NexusGenArgTypes['CloudQuery'][M] : unknown

/**
 * The "Base Context" is the class type that we will use to encapsulate the server state.
 * It will be implemented by ServerContext (real state) and TestContext (client state).
 *
 * This allows us to re-use the entire GraphQL server definition client side for testing,
 * without the need to endlessly mock things.
 */
export abstract class BaseContext {
  abstract readonly actions: BaseActions
  abstract localProjects: Project[]
  abstract viewer: null | Viewer

  constructor (private _launchArgs: LaunchArgs, private _launchOptions: OpenProjectLaunchOptions) {}

  wizard = new Wizard()
  navigationMenu = new NavigationMenu()
  app = new App(this)

  abstract batchedCloudExecute(): NexusGenObjects['CloudQuery']

  abstract batchedCloudExecuteMethod<M extends keyof NexusGenObjects['CloudQuery']>(method: M, args: CloudQueryArgs<M>): NexusGenObjects['CloudQuery'][M]

  get activeProject () {
    return this.app.activeProject
  }

  get launchArgs () {
    return this._launchArgs
  }

  get launchOptions () {
    return this._launchOptions
  }

  isFirstOpen = false
}
