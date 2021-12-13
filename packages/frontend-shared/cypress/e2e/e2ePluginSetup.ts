import path from 'path'
import type { RemoteGraphQLInterceptor, ResetOptionsResult, WithCtxInjected, WithCtxOptions } from './support/e2eSupport'
import { e2eProjectDirs } from './support/e2eProjectDirs'
// import type { CloudExecuteRemote } from '@packages/data-context/src/sources'
import { makeGraphQLServer } from '@packages/graphql/src/makeGraphQLServer'
import { DataContext, globalPubSub, setCtx } from '@packages/data-context'
import * as inspector from 'inspector'
import sinonChai from '@cypress/sinon-chai'
import sinon from 'sinon'
import fs from 'fs'
import { buildSchema, execute, GraphQLError, parse } from 'graphql'
import { Response } from 'cross-fetch'

import { CloudRunQuery } from '../support/mock-graphql/stubgql-CloudTypes'
import { getOperationName } from '@urql/core'

interface InternalOpenProjectArgs {
  argv: string[]
  projectName: string
}

interface InternalAddProjectOpts {
  projectName: string
  open?: boolean
}

const cloudSchema = buildSchema(fs.readFileSync(path.join(__dirname, '../../../graphql/schemas/cloud.graphql'), 'utf8'))

// require'd so we don't conflict with globals loaded in @packages/types
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSubset = require('chai-subset')

const { expect } = chai

chai.use(chaiAsPromised)
chai.use(chaiSubset)
chai.use(sinonChai)

export async function e2ePluginSetup (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
  delete process.env.CYPRESS_INTERNAL_GRAPHQL_PORT
  delete process.env.CYPRESS_INTERNAL_VITE_DEV
  delete process.env.CYPRESS_INTERNAL_VITE_APP_PORT
  delete process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT

  // Set this to a dedicate port so we can debug the state of the tests
  process.env.CYPRESS_INTERNAL_GRAPHQL_PORT = '5555'

  on('task', await makeE2ETasks())

  return {
    ...config,
    env: {
      e2e_isDebugging: Boolean(inspector.url()),
    },
  }
}

export type E2ETaskMap = ReturnType<typeof makeE2ETasks> extends Promise<infer U> ? U : never

interface FixturesShape {
  scaffold (): void
  scaffoldProject (project: string): void
  scaffoldWatch (): void
  remove (): void
  removeProject (name): void
  projectPath (name): string
  get (fixture, encoding?: BufferEncoding): string
  path (fixture): string
}

async function makeE2ETasks () {
  // require'd from @packages/server & @tooling/system-tests so we don't import
  // types which would pollute strict type checking
  const argUtils = require('@packages/server/lib/util/args')
  const { makeDataContext } = require('@packages/server/lib/makeDataContext')
  const Fixtures = require('@tooling/system-tests/lib/fixtures') as FixturesShape

  const cli = require('../../../../cli/lib/cli')
  const cliOpen = require('../../../../cli/lib/exec/open')

  // Remove all the fixtures when the plugin starts
  Fixtures.remove()

  // const tmpDir = path.join(__dirname, '.projects')
  // await util.promisify(rimraf)(tmpDir)
  // Fixtures.setTmpDir(tmpDir)

  interface WithCtxObj {
    fn: string
    options: WithCtxOptions
    // TODO(tim): add an API for intercepting this
    // interceptCloudExecute: (config: CloudExecuteRemote) => {}
  }

  let ctx: DataContext
  let testState: Record<string, any> = {}
  let remoteGraphQLIntercept: RemoteGraphQLInterceptor | undefined
  let scaffoldedProjects = new Set<string>()

  ctx = setCtx(makeDataContext({ mode: 'open', modeOptions: { cwd: process.cwd() } }))

  const gqlPort = await makeGraphQLServer()

  return {
    /**
     * Called before all tests, cleans up any scaffolded projects and returns the global "gqlPort".
     * The same GraphQL server is used for all integration tests, so we can
     * go to http://localhost:5555/graphql and debug the internal state of the application
     */
    async __internal__before () {
      Fixtures.remove()
      scaffoldedProjects = new Set()

      return { gqlPort }
    },

    /**
     * Called before each test to do global setup/cleanup
     */
    async __internal__beforeEach () {
      testState = {}
      await globalPubSub.emitThen('test:cleanup')
      await ctx.actions.app.removeAppDataDir()
      await ctx.actions.app.ensureAppDataDirExists()
      await ctx.resetForTest()
      sinon.reset()
      remoteGraphQLIntercept = undefined

      const fetchApi = ctx.util.fetch

      sinon.stub(ctx.util, 'fetch').get(() => {
        return async (url: RequestInfo, init?: RequestInit) => {
          if (!String(url).endsWith('/test-runner-graphql')) {
            return fetchApi(url, init)
          }

          const { query, variables } = JSON.parse(String(init?.body))
          const document = parse(query)
          const operationName = getOperationName(document)

          let result = await execute({
            operationName,
            document,
            variableValues: variables,
            schema: cloudSchema,
            rootValue: CloudRunQuery,
            contextValue: {
              __server__: ctx,
            },
          })

          if (remoteGraphQLIntercept) {
            try {
              result = await remoteGraphQLIntercept({
                operationName,
                variables,
                document,
                query,
                result,
              })
            } catch (e) {
              const err = e as Error

              result = { data: null, extensions: [], errors: [new GraphQLError(err.message, undefined, undefined, undefined, undefined, err)] }
            }
          }

          return new Response(JSON.stringify(result), { status: 200 })
        }
      })

      return null
    },

    __internal_remoteGraphQLIntercept (fn: string) {
      remoteGraphQLIntercept = new Function('console', 'obj', `return (${fn})(obj)`).bind(null, console) as RemoteGraphQLInterceptor

      return null
    },
    async __internal_addProject (opts: InternalAddProjectOpts) {
      if (!scaffoldedProjects.has(opts.projectName)) {
        this.__internal_scaffoldProject(opts.projectName)
      }

      await ctx.actions.project.addProject({ path: Fixtures.projectPath(opts.projectName), open: opts.open })

      return Fixtures.projectPath(opts.projectName)
    },
    __internal_scaffoldProject (projectName: string) {
      if (fs.existsSync(Fixtures.projectPath(projectName))) {
        Fixtures.removeProject(projectName)
      }

      Fixtures.scaffoldProject(projectName)

      scaffoldedProjects.add(projectName)

      return Fixtures.projectPath(projectName)
    },
    async __internal_openGlobal (argv: string[] = []): Promise<ResetOptionsResult> {
      const openArgv = ['--global', ...argv]

      // Runs the launchArgs through the whole pipeline for the CLI open process,
      // which probably needs a bit of refactoring / consolidating
      const cliOptions = await cli.parseOpenCommand(['open', ...openArgv])
      const processedArgv = cliOpen.processOpenOptions(cliOptions)
      const modeOptions = argUtils.toObject(processedArgv)

      // Reset the state of the context
      await ctx.resetForTest(modeOptions)

      // Handle any pre-loading that should occur based on the launch arg settings
      await ctx.initializeMode()

      return {
        modeOptions,
        e2eServerPort: ctx.appServerPort,
      }
    },
    async __internal_openProject ({ argv, projectName }: InternalOpenProjectArgs): Promise<ResetOptionsResult> {
      if (!scaffoldedProjects.has(projectName)) {
        throw new Error(`${projectName} has not been scaffolded. Be sure to call cy.scaffoldProject('${projectName}') in the test, a before, or beforeEach hook`)
      }

      const openArgv = [...argv, '--project', Fixtures.projectPath(projectName)]

      // Runs the launchArgs through the whole pipeline for the CLI open process,
      // which probably needs a bit of refactoring / consolidating
      const cliOptions = await cli.parseOpenCommand(['open', ...openArgv])
      const processedArgv = cliOpen.processOpenOptions(cliOptions)
      const modeOptions = argUtils.toObject(processedArgv)

      // Reset the state of the context
      await ctx.resetForTest(modeOptions)

      // Handle any pre-loading that should occur based on the launch arg settings
      await ctx.initializeMode()

      return {
        modeOptions,
        e2eServerPort: ctx.appServerPort,
      }
    },
    async __internal_withCtx (obj: WithCtxObj) {
      const options: WithCtxInjected = {
        ...obj.options,
        testState,
        require,
        process,
        projectDir (projectName) {
          if (!e2eProjectDirs.includes(projectName)) {
            throw new Error(`${projectName} is not a fixture project`)
          }

          return Fixtures.projectPath(projectName)
        },
      }

      const val = await Promise.resolve(new Function('ctx', 'options', 'chai', 'expect', 'sinon', `
        return (${obj.fn})(ctx, options, chai, expect, sinon)
      `).call(undefined, ctx, options, chai, expect, sinon))

      return val || null
    },
  }
}
