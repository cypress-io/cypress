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

  resolveOpenProjectConfig (): FullConfig {
    // @ts-ignore
    return {
      resolved: {
        e2e: {
          from: 'default',
          value: {},
        },
        component: {
          from: 'config',
          value: {
            viewportHeight: 100,
          },
        },
      },
    }
  }

  async initializeOpenProject () {}
  async launchOpenProject () {}

  addProject () {
    return createTestProject('/some/new/project', this.ctx)
  }

  async initializeConfig () {
    // @ts-ignore
    return {} as FullConfig
  }
}

const createTestProject = (projectRoot: string, ctx: BaseContext) => new LocalProject(projectRoot, ctx)

export class ClientTestContext extends BaseContext {
  readonly actions = new ClientTestActions(this)
  readonly projects = []

  // localProjects: Project[] = [this.testProject]
  dashboardProjects: DashboardProject[] = []
  localProjects: LocalProject[] = [createTestProject('/new/project', this)]
  viewer = null
}
