import { BaseActions, BaseContext, Project } from '@packages/graphql'
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
}

const createTestProject = (projectRoot: string, ctx: BaseContext) => new Project(projectRoot, ctx)

const TEST_LAUNCH_ARGS: LaunchArgs = {
  config: {},
  cwd: '/current/working/dir',
  _: ['/current/working/dir'],
  projectRoot: '/project/root',
  invokedFromCli: false,
  browser: browsers[0],
  testingType: 'e2e',
  project: '/project/root',
  os: 'linux',
}

export class ClientTestContext extends BaseContext {
  constructor (_launchArgs?: LaunchArgs, _launchOptions?: OpenProjectLaunchOptions) {
    super(_launchArgs ?? TEST_LAUNCH_ARGS, _launchOptions ?? {})
  }

  readonly actions = new ClientTestActions(this)
  readonly projects = []

  // localProjects: Project[] = [this.testProject]
  localProjects: Project[] = [createTestProject('/new/project', this)]
  viewer = null

  delegateToRemoteQuery () {
    return null
  }

  delegateToRemoteQueryBatched () {
    return null
  }

  batchedCloudExecute () {
    return null
  }

  batchedCloudExecuteMethod () {
    return null
  }
}
