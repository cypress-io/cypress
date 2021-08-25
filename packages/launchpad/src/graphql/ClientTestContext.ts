import { BaseActions, BaseContext, Project } from '@packages/graphql'
import type { FullConfig } from '@packages/server/lib/config'

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

  async authenticate () {}
  async createConfigFile () {}

  async initializeOpenProject () {}

  async launchOpenProject () {

  }

  resolveOpenProjectConfig () {
    return null
  }

  async logout () {}
  async getProjectId () {
    return 'test-project-id'
  }
  async getRuns () {
    return []
  }
  async getRecordKeys () {
    return []
  }
  async getBrowsers () {
    return []
  }

  addProject () {
    return createTestProject('/some/new/project', this.ctx)
  }

  async initializeConfig () {
    // @ts-ignore
    return {} as FullConfig
  }
}

const createTestProject = (projectRoot: string, ctx: BaseContext) => new Project(projectRoot, ctx)

export class ClientTestContext extends BaseContext {
  readonly actions = new ClientTestActions(this)
  readonly projects = []

  // localProjects: Project[] = [this.testProject]
  localProjects: Project[] = [createTestProject('/new/project', this)]
  viewer = null

  batchedCloudExecute () {
    return null
  }

  batchedCloudExecuteMethod () {
    return null
  }
}
