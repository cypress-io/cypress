import type { BaseActions } from '../actions/BaseActions'
import { App, User, Wizard } from '../entities'
import type { Project } from '../entities/Project'

/**
 * The "Base Context" is the class type that we will use to encapsulate the server state.
 * It will be implemented by ServerContext (real state) and TestContext (client state).
 *
 * This allows us to re-use the entire GraphQL server definition client side for testing,
 * without the need to endlessly mock things.
 */
export abstract class BaseContext {
  abstract readonly actions: BaseActions
  abstract projects: Project[]
  abstract user?: User

  wizard = new Wizard()
  app = new App(this)

  isFirstOpen = false

  get activeProject () {
    return this.app.activeProject
  }
}
