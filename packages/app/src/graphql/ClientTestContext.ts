import { BaseActions, BaseContext, DashboardProject, LocalProject } from '@packages/graphql'
import type { FullConfig } from '@packages/server/lib/config'
import { browsers, LaunchArgs, OpenProjectLaunchOptions } from '@packages/types'

export class ClientTestActions extends BaseActions {
  constructor (protected ctx: ClientTestContext) {
    super(ctx)
  }

  async initializeOpenProject () {
    return
  }

  async launchOpenProject () {
    return
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

  addProject () {
    return createTestProject('/some/new/project', this.ctx)
  }

  async initializeConfig () {
    // @ts-ignore
    return {} as FullConfig
  }

  isFirstTime () {
    return true
  }
}

const createTestProject = (projectRoot: string, ctx: BaseContext) => new LocalProject(projectRoot, ctx)

const TEST_LAUNCH_ARGS: LaunchArgs = {
  config: {},
  cwd: '/dev/null',
  browser: browsers[0],
  project: '/dev/null',
  projectRoot: '/dev/null',
  invokedFromCli: true,
  testingType: 'e2e',
  os: 'darwin',
  _: [''],
}

export class ClientTestContext extends BaseContext {
  constructor (_launchArgs?: LaunchArgs, _launchOptions?: OpenProjectLaunchOptions) {
    super(_launchArgs ?? TEST_LAUNCH_ARGS, _launchOptions ?? {})
  }

  readonly actions = new ClientTestActions(this)
  readonly projects = []

  // localProjects: Project[] = [this.testProject]
  dashboardProjects: DashboardProject[] = []
  localProjects: LocalProject[] = [createTestProject('/new/project', this)]
  viewer = null
}
