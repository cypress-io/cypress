import path from 'path'
import execa from 'execa'

import type { CyTaskResult, OpenGlobalModeOptions, RemoteGraphQLInterceptor, ResetOptionsResult, WithCtxInjected, WithCtxOptions } from './support/e2eSupport'
import { fixtureDirs } from '@tooling/system-tests'
// import type { CloudExecuteRemote } from '@packages/data-context/src/sources'
import { makeGraphQLServer } from '@packages/graphql/src/makeGraphQLServer'
import { clearCtx, DataContext, globalPubSub, setCtx } from '@packages/data-context'
import * as inspector from 'inspector'
import sinonChai from '@cypress/sinon-chai'
import sinon from 'sinon'
import fs from 'fs-extra'
import { buildSchema, execute, ExecutionResult, GraphQLError, parse } from 'graphql'
import { Response } from 'cross-fetch'

import { CloudQuery } from '@packages/graphql/test/stubCloudTypes'
import { getOperationName } from '@urql/core'
import pDefer from 'p-defer'

const pkg = require('@packages/root')

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
  scaffoldProject (project: string): Promise<void>
  clearFixtureNodeModules (project: string): void
  scaffoldWatch (): void
  remove (): void
  removeProject (name): void
  projectPath (name): string
  projectFixturePath(name): string
  get (fixture, encoding?: BufferEncoding): string
  path (fixture): string
}

async function makeE2ETasks () {
  // require'd from @packages/server & @tooling/system-tests so we don't import
  // types which would pollute strict type checking
  const argUtils = require('@packages/server/lib/util/args')
  const { makeDataContext } = require('@packages/server/lib/makeDataContext')
  const Fixtures = require('@tooling/system-tests') as FixturesShape
  const { scaffoldCommonNodeModules, scaffoldProjectNodeModules } = require('@tooling/system-tests/lib/dep-installer')

  const cli = require('../../../../cli/lib/cli')
  const cliUtil = require('../../../../cli/lib/util')
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

  const cachedCwd = process.cwd()

  await clearCtx()
  ctx = setCtx(makeDataContext({ mode: 'open', modeOptions: { cwd: process.cwd() } }))

  const launchpadPort = await makeGraphQLServer()

  const __internal_scaffoldProject = async (projectName: string, isRetry = false): Promise<string> => {
    if (fs.existsSync(Fixtures.projectPath(projectName))) {
      Fixtures.removeProject(projectName)
    }

    Fixtures.clearFixtureNodeModules(projectName)

    await Fixtures.scaffoldProject(projectName)

    await scaffoldCommonNodeModules()

    try {
      await scaffoldProjectNodeModules(projectName)
    } catch (e) {
      if (isRetry) {
        throw e
      }

      // If we have an error, it's likely that we don't have a lockfile, or it's out of date.
      // Let's run a quick "yarn" in the directory, kill the node_modules, and try again
      await execa('yarn', { cwd: Fixtures.projectFixturePath(projectName), stdio: 'inherit', shell: true })
      await fs.remove(path.join(Fixtures.projectFixturePath(projectName), 'node_modules'))

      return await __internal_scaffoldProject(projectName, true)
    }

    scaffoldedProjects.add(projectName)

    return Fixtures.projectPath(projectName)
  }

  return {
    /**
     * Called before all tests, cleans up any scaffolded projects and returns the global "launchpadPort".
     * The same GraphQL server is used for all integration tests, so we can
     * go to http://localhost:5555/graphql and debug the internal state of the application
     */
    async __internal__before () {
      Fixtures.remove()
      scaffoldedProjects = new Set()
      process.chdir(cachedCwd)

      return { launchpadPort }
    },

    /**
     * Force a reset to the correct CWD after all tests have completed, just incase this
     * was modified by any code under test.
     */
    __internal__after () {
      process.chdir(cachedCwd)

      return null
    },

    /**
     * Called before each test to do global setup/cleanup
     */
    async __internal__beforeEach () {
      testState = {}
      await DataContext.waitForActiveRequestsToFlush()
      await globalPubSub.emitThen('test:cleanup')
      await ctx.actions.app.removeAppDataDir()
      await ctx.actions.app.ensureAppDataDirExists()
      await ctx.reinitializeCypress()
      sinon.reset()
      sinon.restore()
      remoteGraphQLIntercept = undefined

      const fetchApi = ctx.util.fetch

      // Stub all of the things that we can't actually execute (electron/os operations),
      // so we can verify they were called
      sinon.stub(ctx.actions.electron, 'openExternal')
      sinon.stub(ctx.actions.electron, 'showItemInFolder')

      const operationCount: Record<string, number> = {}

      sinon.stub(ctx.util, 'fetch').callsFake(async (url: RequestInfo | URL, init?: RequestInit) => {
        if (String(url).endsWith('/test-runner-graphql')) {
          const { query, variables } = JSON.parse(String(init?.body))
          const document = parse(query)
          const operationName = getOperationName(document)

          operationCount[operationName ?? 'unknown'] = operationCount[operationName ?? 'unknown'] ?? 0

          let result: ExecutionResult | Response = await execute({
            operationName,
            document,
            variableValues: variables,
            schema: cloudSchema,
            rootValue: CloudQuery,
            contextValue: {
              __server__: ctx,
            },
          })

          operationCount[operationName ?? 'unknown']++

          if (remoteGraphQLIntercept) {
            try {
              result = await Promise.resolve(remoteGraphQLIntercept({
                operationName,
                variables,
                document,
                query,
                result,
                callCount: operationCount[operationName ?? 'unknown'],
                Response,
              }, testState))
            } catch (e) {
              const err = e as Error

              const code = err.message.includes('Unauthorized') ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR'

              result = { data: null, extensions: [], errors: [new GraphQLError(err.message, undefined, undefined, undefined, undefined, err, { code })] }
            }
          }

          if (result instanceof Response) {
            return result
          }

          return new Response(JSON.stringify(result), { status: 200 })
        }

        if (String(url) === 'https://download.cypress.io/desktop.json') {
          return new Response(JSON.stringify({
            name: 'Cypress',
            version: pkg.version,
          }), { status: 200 })
        }

        if (String(url) === 'https://registry.npmjs.org/cypress') {
          return new Response(JSON.stringify({
            'time': {
              [pkg.version]: '2022-02-10T01:07:37.369Z',
            },
          }), { status: 200 })
        }

        if (String(url).startsWith('https://on.cypress.io/v10-video-embed/')) {
          return new Response(JSON.stringify({
            videoHtml: `<iframe
              src="https://player.vimeo.com/video/668764401?h=0cbc785eef"
              class="rounded h-full bg-gray-1000 w-full"
              frameborder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowfullscreen
            />`,
          }), { status: 200 })
        }

        return fetchApi(url, init)
      })

      return null
    },

    __internal_remoteGraphQLIntercept (fn: string) {
      remoteGraphQLIntercept = new Function('console', 'obj', 'testState', `return (${fn})(obj, testState)`).bind(null, console) as RemoteGraphQLInterceptor

      return null
    },
    async __internal_addProject (opts: InternalAddProjectOpts) {
      if (!scaffoldedProjects.has(opts.projectName)) {
        await __internal_scaffoldProject(opts.projectName)
      }

      await ctx.actions.project.addProject({ path: Fixtures.projectPath(opts.projectName), open: opts.open })

      return Fixtures.projectPath(opts.projectName)
    },
    __internal_scaffoldProject,
    async __internal_openGlobal ({ argv = [], byFlag = true }: OpenGlobalModeOptions): Promise<ResetOptionsResult> {
      let isInstalledGloballyStub

      if (byFlag) {
        argv.unshift('--global')
      } else {
        isInstalledGloballyStub = sinon.stub(cliUtil, 'isInstalledGlobally').returns(true)
      }

      // Runs the launchArgs through the whole pipeline for the CLI open process,
      // which probably needs a bit of refactoring / consolidating
      const cliOptions = await cli.parseOpenCommand(['open', ...argv])
      const processedArgv = cliOpen.processOpenOptions(cliOptions)
      const modeOptions = { ...argUtils.toObject(processedArgv), invokedFromCli: true }

      // Reset the state of the context
      await ctx.reinitializeCypress(modeOptions)

      // Handle any pre-loading that should occur based on the launch arg settings
      await ctx.initializeMode()

      isInstalledGloballyStub?.restore()

      return {
        modeOptions,
        e2eServerPort: ctx.appServerPort,
      }
    },
    async __internal_openProject ({ argv, projectName }: InternalOpenProjectArgs): Promise<ResetOptionsResult> {
      if (!scaffoldedProjects.has(projectName)) {
        throw new Error(`${projectName} has not been scaffolded. Be sure to call cy.scaffoldProject('${projectName}') in the test, a before, or beforeEach hook`)
      }

      const openArgv = [...argv, '--project', Fixtures.projectPath(projectName), '--port', '4455']

      // Runs the launchArgs through the whole pipeline for the CLI open process,
      // which probably needs a bit of refactoring / consolidating
      const cliOptions = await cli.parseOpenCommand(['open', ...openArgv])
      const processedArgv = cliOpen.processOpenOptions(cliOptions)
      const modeOptions = { ...argUtils.toObject(processedArgv), invokedFromCli: true }

      // Reset the state of the context
      await ctx.reinitializeCypress(modeOptions)

      // Handle any pre-loading that should occur based on the launch arg settings
      await ctx.initializeMode()

      return {
        modeOptions,
        e2eServerPort: ctx.appServerPort,
      }
    },
    async __internal_withCtx (obj: WithCtxObj): Promise<CyTaskResult<any>> {
      const options: WithCtxInjected = {
        ...obj.options,
        testState,
        require,
        process,
        sinon,
        pDefer,
        projectDir (projectName) {
          if (!fixtureDirs.includes(projectName)) {
            throw new Error(`${projectName} is not a fixture project`)
          }

          return Fixtures.projectPath(projectName)
        },
      }
      let i = 0
      let lastErr: Error | undefined
      const retries = obj.options.retry ? obj.options.retryCount ?? 5 : 0

      while (i++ <= retries) {
        try {
          const value = await Promise.resolve(new Function('ctx', 'options', 'chai', 'expect', 'sinon', `
            return (${obj.fn})(ctx, options, chai, expect, sinon)
          `).call(undefined, ctx, options, chai, expect, sinon))

          return { value }
        } catch (e: any) {
          if (i <= retries) {
            await new Promise((resolve) => setTimeout(resolve, obj.options.retryDelay ?? 1000))
          }

          lastErr = e
        }
      }

      lastErr = lastErr || new Error('Error in withCtx')

      return {
        error: {
          stack: lastErr.stack,
          message: lastErr.message,
          name: lastErr.name,
        },
      }
    },
  }
}
