import { expect } from 'chai'
import dedent from 'dedent'
import { execute, ExecutionResult, parse, subscribe } from 'graphql'
import { DataContext } from '../../../src'
import { createTestDataContext, scaffoldProject } from '../helper'

describe('GraphQLDataSource', () => {
  let ctx: DataContext
  let projectPath: string
  let pushFragmentIterator: AsyncIterableIterator<ExecutionResult>
  let pushFragmentNextVal: Promise<ExecutionResult>

  beforeEach(async () => {
    ctx = createTestDataContext('open')
    ctx.update((d) => {
      d.user = {
        name: 'test tester',
        email: 'test@example.com',
        authToken: 'abc123',
      }
    })

    projectPath = await scaffoldProject('component-tests')
    await ctx.actions.project.setCurrentProject(projectPath)
    ctx.project.projectId = async () => 'abc123'

    pushFragmentIterator = await Promise.resolve(subscribe({
      schema: ctx.config.schema,
      contextValue: ctx,
      document: parse(`subscription {
        pushFragment {
          target
          fragment
          data
        }
      }`),
    })) as AsyncIterableIterator<ExecutionResult>

    pushFragmentNextVal = pushFragmentIterator.next().then(({ value }) => value)
  })

  afterEach(() => {
    pushFragmentIterator.return()
    ctx.destroy()
  })

  function executeQuery (query: string) {
    return Promise.resolve(execute({
      document: parse(query),
      schema: ctx.config.schema,
      contextValue: ctx,
    }))
  }

  describe('pushQueryFragment', () => {
    it('calls "pushQueryFragment" on a query field that has resolved', async () => {
      const result = await executeQuery(`{ cloudViewer { id } }`)

      // Initial cloudViewer result returns null
      expect(result.data.cloudViewer).to.eq(null)

      const { target, data, fragment } = (await pushFragmentNextVal).data.pushFragment[0]

      expect(target).to.eq('Query')
      expect(data).to.eql({
        cloudViewer: {
          id: 'Q2xvdWRVc2VyOjE=',
        },
      })

      expect(fragment.trim()).to.eq(dedent`
        fragment GeneratedFragment on Query {
          cloudViewer {
            id
          }
        }
      `)
    })
  })

  describe('pushNodeFragment', () => {
    it('calls "pushNodeFragment" on a node field that eventually resolves', async () => {
      const result = await executeQuery(`{ currentProject { id cloudProject { __typename ... on CloudProject { id name } } } }`)

      // Initial cloudProject result returns null
      expect(result.data.currentProject.cloudProject).to.eq(null)

      const { target, data, fragment } = (await pushFragmentNextVal).data.pushFragment[0]

      expect(target).to.eq('CurrentProject')
      expect(data).to.eql({
        __typename: 'CurrentProject',
        cloudProject: {
          __typename: 'CloudProject',
          id: 'Q2xvdWRQcm9qZWN0OjY=',
          name: 'cloud-project-abc123',
        },
        id: Buffer.from(`CurrentProject:${projectPath}`, 'utf8').toString('base64'),
      })

      expect(fragment.trim()).to.eq(dedent`
        fragment GeneratedFragment on CurrentProject {
          id
          cloudProject {
            __typename
            ... on CloudProject {
              id
              name
            }
          }
        }
      `)
    })

    it('calls "pushNodeFragment" on a node field that eagerly resolves, but has an updated value', async () => {
      const result = await executeQuery(`{ cloudViewer { id } }`)

      // Initial cloudProject result returns null
      expect(result.data.cloudViewer).to.eql(null)
      await pushFragmentNextVal

      pushFragmentNextVal = pushFragmentIterator.next().then(({ value }) => value)

      const result2 = await executeQuery(`{ cloudViewer { id cloudOrganizationsUrl } }`)

      // Initial cloudProject result returns null
      expect(result2.data.cloudViewer).to.eql({ id: 'Q2xvdWRVc2VyOjE=', cloudOrganizationsUrl: null })

      const { target, data, fragment } = (await pushFragmentNextVal).data.pushFragment[0]

      expect(target).to.eq('Query')
      expect(data).to.eql({
        cloudViewer: {
          id: 'Q2xvdWRVc2VyOjE=',
          cloudOrganizationsUrl: 'http://dummy.cypress.io/organizations',
        },
      })

      expect(fragment.trim()).to.eq(dedent`
        fragment GeneratedFragment on Query {
          cloudViewer {
            id
            cloudOrganizationsUrl
          }
        }
      `)
    })
  })
})
