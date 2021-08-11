import { BaseActions, BaseContext, ProjectBaseContract, RunGroup } from '@packages/graphql'

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

  async getRuns ({ projectId }: { projectId: string }): Promise<RunGroup[]> {
    return [
      new RunGroup({
        id: '1',
        createdAt: '2016-05-13T02:35:12.748Z',
        completedAt: '2016-05-13T02:35:12.748Z',
        totalPassed: 5,
        totalFailed: 0,
        totalPending: 0,
        totalSkipped: 0,
        totalDuration: 16000,
        status: 'failed',
        commit: {
          authorName: 'Ryan',
          branch: 'master',
          message: 'Updating the hover state for the button component',
          authorEmail: 'ryan@cypress.io',
          sha: 'sha',
          url: ''
        }
      })
    ]
  }

  async logout () {}
  async authenticate () {}
}

export class ClientTestContext extends BaseContext {
  readonly actions = new ClientTestActions(this)
  readonly projects = []
  user = undefined
}
