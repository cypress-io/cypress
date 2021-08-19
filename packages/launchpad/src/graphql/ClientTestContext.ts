import { BaseActions, BaseContext, DashboardProject, LocalProject } from '@packages/graphql'
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
    return new LocalProject('foo', this.ctx)
  }

  async initializeConfig () {
    // @ts-ignore
    return {} as FullConfig
  }
}

export class ClientTestContext extends BaseContext {
  readonly actions = new ClientTestActions(this)
  readonly projects = []

  // localProjects: Project[] = [this.testProject]
  dashboardProjects: DashboardProject[] = []
  localProjects: LocalProject[] = []
  viewer = null
}
