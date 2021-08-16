import type { NxsMutationArgs } from 'nexus-decorators'
import { BaseActions, BaseContext, DashboardProject, LocalProject, ProjectContract } from '@packages/graphql'
import type { Project } from '../../../graphql/src/entities/Project'
import { Config } from '../../../graphql/src/entities/Config'

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
  async createProjectBase (input: NxsMutationArgs<'addProject'>['input']) {
    const contract: ProjectContract = {
      projectRoot: '',
    }

    return contract
  }
  async logout () {}
  async getProjectId () {
    return 'test-project-id'
  }
  async getRuns () {
    return []
  }
}

const createLocalProject = (ctx: ClientTestContext) => new LocalProject(new Config({ projectRoot: '/usr/dev/project' }), ctx)

export class ClientTestContext extends BaseContext {
  readonly actions = new ClientTestActions(this)
  readonly projects = []

  private testProject = createLocalProject(this)

  localProjects: Project[] = [this.testProject]
  dashboardProjects: DashboardProject[] = []
  viewer = null
}
