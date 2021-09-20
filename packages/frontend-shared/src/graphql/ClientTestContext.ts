import { BaseActions, BaseContext, Project } from '@packages/graphql'
import { remoteTestSchema } from '@packages/graphql/src/testing/remoteTestSchema'
import type { FullConfig } from '@packages/server/lib/config'
import { browsers, LaunchArgs, OpenProjectLaunchOptions } from '@packages/types'

// eslint-disable-next-line no-duplicate-imports
import * as stubData from '@packages/graphql/src/testing/remoteTestSchema'

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

  async loadProjects () {
    this.addProject()

    return this.ctx.app.projects
  }

  async initializeConfig () {
    // @ts-ignore
    return {} as FullConfig
  }

  isFirstTime (projectRoot: string, testingType: Cypress.TestingType) {
    if (testingType === 'component') {
      return false
    }

    return true
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
  global: false,
  project: '/project/root',
  testingType: 'e2e',
  os: 'linux',
}

export class ClientTestContext extends BaseContext {
  _remoteSchema = remoteTestSchema
  constructor (_launchArgs?: LaunchArgs, _launchOptions?: OpenProjectLaunchOptions) {
    super(_launchArgs ?? TEST_LAUNCH_ARGS, _launchOptions ?? {})
  }

  readonly actions = new ClientTestActions(this)
  readonly projects = []

  // localProjects: Project[] = [this.testProject]
  localProjects: Project[] = [createTestProject('/new/project', this)]
  viewer = null

  stubData = stubData
}
