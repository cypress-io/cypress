import axios from 'axios'
import type { FoundBrowser, FullConfig, LaunchArgs, OpenProjectLaunchOptions } from '@packages/types'
import { BaseActions, BaseContext, DashboardProject, LocalProject, Viewer, Wizard } from '../../src'
import { startGraphQLServer, closeGraphQLServer, setServerContext } from '../../src/server'

interface TestContextInjectionOptions {
  wizard?: Wizard
  launchArgs?: LaunchArgs
  launchOptions?: OpenProjectLaunchOptions
  Actions?: typeof TestActions
}

export class TestActions extends BaseActions {
  ctx: BaseContext

  constructor (_ctx: BaseContext) {
    super(_ctx)
    this.ctx = _ctx
  }

  installDependencies () {}
  createConfigFile () {}

  async launchOpenProject () {}
  resolveOpenProjectConfig (): FullConfig {
    return {
      projectRoot: '/root/path',
      resolved: {},
    }
  }

  addProject (projectRoot: string) {
    return new LocalProject(projectRoot, this.ctx)
  }

  async authenticate () {
    this.ctx.viewer = new Viewer(this.ctx, {
      authToken: 'test-auth-token',
      email: 'test@cypress.io',
      name: 'cypress test',
    })
  }

  async logout () {
    this.ctx.viewer = null
  }

  async getProjectId () {
    return 'test-project-id'
  }
  async getRuns () {
    return []
  }
  async getRecordKeys () {
    return []
  }

  async initializeOpenProject () {}

  async getBrowsers () {
    const browser: FoundBrowser = {
      displayName: 'chrome',
      family: 'chromium',
      majorVersion: '1.0.0',
      name: 'chrome',
      channel: 'dev',
      version: '1.0.0',
      path: '/dev/chrome',
    }

    return [browser]
  }

  async initializeConfig () {}
}

export class TestContext extends BaseContext {
  localProjects: LocalProject[] = []
  dashboardProjects: DashboardProject[] = []
  readonly actions: BaseActions
  viewer = null

  constructor ({ wizard, launchArgs, launchOptions, Actions }: TestContextInjectionOptions = {}) {
    super(launchArgs || {
      config: {},
      cwd: '/current/working/dir',
      _: ['/current/working/dir'],
      projectRoot: '/project/root',
      invokedFromCli: false,
      browser: null,
      testingType: 'e2e',
      project: '/project/root',
      os: 'linux',
    }, launchOptions || {})

    this.actions = Actions ? new Actions(this) : new TestActions(this)
    if (wizard) {
      this.wizard = wizard
    }
  }
}

/**
 * Creates a new GraphQL server to query during integration tests.
 * Also performsn any clean up from previous tests.
 * Optionally you may provide a context to orchestrate testing
 * specific scenarios or states.
 */
export const initGraphql = async (ctx: BaseContext) => {
  await closeGraphQLServer()
  if (ctx) {
    setServerContext(ctx)
  }

  return startGraphQLServer({ port: 51515 })
}

export const makeRequest = async (endpoint: string, query: string) => {
  const res = await axios.post(endpoint,
    JSON.stringify({
      query,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  return res.data.data
}
