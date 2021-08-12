import type { BaseActions } from '../actions/BaseActions'
import { App, NavigationMenu, Wizard, LocalProject, Viewer, DashboardProject } from '../entities'

/**
 * The "Base Context" is the class type that we will use to encapsulate the server state.
 * It will be implemented by ServerContext (real state) and TestContext (client state).
 *
 * This allows us to re-use the entire GraphQL server definition client side for testing,
 * without the need to endlessly mock things.
 */
export abstract class BaseContext {
  abstract readonly actions: BaseActions
  abstract localProjects: LocalProject[]
  abstract dashboardProjects: DashboardProject[]
  abstract viewer?: Viewer = undefined

  wizard = new Wizard()
  navigationMenu = new NavigationMenu()
  app = new App(this)

  isFirstOpen = false
}
