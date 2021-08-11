import type { NxsMutationArgs } from 'nexus-decorators'
import { expect } from 'chai'
import snapshot from 'snap-shot-it'
import axios from 'axios'
import { BaseActions, BaseContext, Project, Wizard } from '../../src'
import { startGraphQLServer, closeGraphQLServer, setServerContext } from '../../src/server'
import type { NavigationItem } from '../../src/entities/NavigationItem'

class TestActions extends BaseActions {
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

class TestContext extends BaseContext {
  projects: Project[] = []
  readonly actions: BaseActions

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
const initGraphql = async (ctx: BaseContext) => {
  await closeGraphQLServer()
  if (ctx) {
    setServerContext(ctx)
  }

  return startGraphQLServer({ port: 51515 })
}

const makeRequest = async (endpoint: string, query: string) => {
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

describe('NavigationMenu', () => {
  it('returns null when framework is set but bundler is null', async () => {
    const context = new TestContext()
    const { endpoint } = await initGraphql(context)

    let result = await makeRequest(endpoint, `
      {
        navigationMenu {
          items {
            id
            name
            selected
            iconPath
          }
        }
      }
    `)

    snapshot(result)

    let selected: NavigationItem = result.navigationMenu.items.find((x: NavigationItem) => x.selected)

    expect(selected.name).to.eq('Project Setup')

    result = await makeRequest(endpoint, `
      mutation M {
        navigationMenuSetItem (type: settings) {
          items {
            id
            name
            selected
            iconPath
          }
        }
      }
    `)

    selected = result.navigationMenuSetItem.items.find((x: NavigationItem) => x.selected)
    expect(selected.name).to.eq('Settings')
  })
})
