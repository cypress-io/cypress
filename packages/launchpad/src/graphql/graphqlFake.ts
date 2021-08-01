import { BaseActions, BaseContext, ProjectBaseContract } from '@packages/graphql'

export class ClientTestActions extends BaseActions {
  constructor (protected ctx: ClientTestContext) {
    super(ctx)
  }

  async installDependencies () {
    return
  }

  async initializePlugins () {
    return
  }

  createProjectBase (): ProjectBaseContract {
    return {
      isOpen: false,
      async initializePlugins () {
        return
      },
    }
  }
}

export class ClientTestContext extends BaseContext {
  readonly actions = new ClientTestActions(this)
  readonly projects = []
}
