import axios from 'axios'
import type { NxsMutationArgs } from 'nexus-decorators'
import { BaseActions, BaseContext, DashboardProject, LocalProject, Viewer, Wizard } from '../../src'
import { Config } from '../../src/entities/Config'
import { startGraphQLServer, closeGraphQLServer, setServerContext } from '../../src/server'

interface TestContextInjectionOptions {
  wizard?: Wizard
}

export class TestActions extends BaseActions {
  ctx: BaseContext

  constructor (_ctx: BaseContext) {
    super(_ctx)
    this.ctx = _ctx
  }

  installDependencies () {}
  createConfigFile () {}
  createProjectBase (input: NxsMutationArgs<'addProject'>['input']) {
    return new LocalProject(
      new Config({
        projectRoot: '/foo/bar',
      }),
      this.ctx,
    )
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
}

export class TestContext extends BaseContext {
  localProjects: LocalProject[] = []
  dashboardProjects: DashboardProject[] = []
  readonly actions: BaseActions
  viewer = null

  constructor ({ wizard }: TestContextInjectionOptions = {}) {
    super()
    this.actions = new TestActions(this)
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
