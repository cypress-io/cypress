import type { NxsMutationArgs } from 'nexus-decorators'
import axios from 'axios'
import { BaseActions, BaseContext, Project, User, Wizard } from '../../src'
import { startGraphQLServer, closeGraphQLServer, setServerContext } from '../../src/server'

class TestActions extends BaseActions {
  async authenticate () {
    this.ctx.user = new User({
      authToken: 'test-auth-token',
      email: 'test@cypress.io',
      name: 'cypress test',
    })
  }

  async getRuns ({ projectId }: { projectId: string }) {}

  async logout () {
    this.ctx.user = undefined
  }

  installDependencies () {}

  createConfigFile () {}

  createProjectBase (input: NxsMutationArgs<'addProject'>['input']) {
    return new Project({
      isCurrent: true,
      projectRoot: '/foo/bar',
      projectBase: {
        isOpen: true,
        initializePlugins: () => Promise.resolve(),
      },
    })
  }
}

interface TestContextInjectionOptions {
  wizard?: Wizard
}

export class TestContext extends BaseContext {
  projects: Project[] = []
  readonly actions: BaseActions
  user: undefined

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
