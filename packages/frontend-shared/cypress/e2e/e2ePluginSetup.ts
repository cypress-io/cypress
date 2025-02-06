import { hookRequire } from '@packages/server/hook-require'

hookRequire({ forceTypeScript: false })

// Important!!! Ensure to import the prod dependencies (i.e. things that will be executing from the inner Cypress of Cypress in Cypress)
// from ./prod-dependencies.ts as this is pre-loaded in the v8 snapshot via ./v8-snapshot-entry.ts. Otherwise, these dependencies
// will not properly be marked as loaded in the v8 snapshot and may be reloaded when referenced from within the snapshot itself.
import {
  getOperationName,
  Response,
  makeGraphQLServer,
  clearCtx,
  DataContext,
  globalPubSub,
  setCtx,
  buildSchema,
  execute,
  ExecutionResult,
  GraphQLError,
  parse,
} from './prod-dependencies'

import path from 'path'
import execa from 'execa'
import _ from 'lodash'

import type { CyTaskResult, OpenGlobalModeOptions, RemoteGraphQLBatchInterceptor, RemoteGraphQLInterceptor, ResetOptionsResult, WithCtxInjected, WithCtxOptions } from '../support/e2e'
import { fixtureDirs } from '@tooling/system-tests'
import * as inspector from 'inspector'
// tslint:disable-next-line: no-implicit-dependencies - requires cypress
import sinonChai from '@cypress/sinon-chai'
import sinon from 'sinon'
import fs from 'fs-extra'
import { CYPRESS_REMOTE_MANIFEST_URL, NPM_CYPRESS_REGISTRY_URL } from '@packages/types'

import { CloudQuery } from '@packages/graphql/test/stubCloudTypes'
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
  // @ts-ignore getSnapshotResult is injected by the snapshot script
  if (!['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE) && typeof global.getSnapshotResult === 'undefined') {
    throw new Error('getSnapshotResult is undefined. v8 snapshots are not being used in Cypress in Cypress. This can happen if CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT is not set')
  }

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
  const { makeDataContext } = require('./prod-dependencies')
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
  let remoteGraphQLOptions: Record<string, any> | undefined
  let remoteGraphQLInterceptBatched: RemoteGraphQLBatchInterceptor | undefined
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
      await scaffoldProjectNodeModules({ project: projectName })
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
      process.chdir(cachedCwd)
      testState = {}
      remoteGraphQLOptions = {}

      await globalPubSub.emitThen('test:cleanup')
      await ctx.actions.app.removeAppDataDir()
      await ctx.actions.app.ensureAppDataDirExists()
      await ctx.reinitializeCypress()
      sinon.reset()
      sinon.restore()
      remoteGraphQLIntercept = undefined
      remoteGraphQLInterceptBatched = undefined

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

          if (operationName?.startsWith('batchTestRunnerExecutionQuery') && remoteGraphQLInterceptBatched) {
            const fn = remoteGraphQLInterceptBatched
            const keys: string[] = []
            const values: Promise<any>[] = []
            const finalVal: Record<string, any> = {}
            const errors: GraphQLError[] = []

            // The batch execution plugin (https://www.graphql-tools.com/docs/batch-execution) batches the
            // query variables & payloads by rewriting both the fields & variables to ensure there
            // are no collisions. It does so in a consistent manner, prefixing each field with an incrementing integer,
            // and prefixing the variables within that selection set with the same id
            //
            // It ends up looking something like this:
            //
            // query ($_0_variableA: String, $_0_variableB: String, $_1_variableA: String, $_1_variableB: String) {
            //   _0_someQueryField: someQueryField(argA: $_0_variableA) {
            //     id
            //     field(argB: $_0_variableB))
            //   }
            //   _1_someQueryField: someQueryField(argA: $_1_variableA) {
            //     id
            //     field(argB: $_1_variableB))
            //   }
            // }
            //
            // To make it simpler to test, we take this knowledge and use some regexes & rewriting it to parse out the index,
            // and re-write the variables as though we were executing the query individually, the same way the plugin does when
            // we return the resolved data. We then expect that you return the data for the individual row
            //
            for (const [key, val] of Object.entries(result.data as Record<string, any>)) {
              const re = /^_(\d+)_(.*?)$/.exec(key)

              if (!re) {
                finalVal[key] = val
                continue
              }

              const [, capture1, capture2] = re
              const subqueryVariables = _.transform(_.pickBy(variables, (val, key) => key.startsWith(`_${capture1}_`)), (acc, val, k) => {
                acc[k.replace(`_${capture1}_`, '')] = val
              }, {})

              keys.push(key)
              values.push(Promise.resolve().then(() => {
                return fn({
                  key,
                  index: Number(capture1),
                  field: capture2,
                  variables: subqueryVariables,
                  result: result[key],
                }, testState)
              }).catch((e) => {
                errors.push(new GraphQLError(e.message, undefined, undefined, undefined, [key], e))

                return null
              }))
            }
            result = {
              data: _.zipObject(keys, (await Promise.allSettled(values)).map((v) => v.status === 'fulfilled' ? v.value : v.reason)),
              errors: errors.length ? [...(result.errors ?? []), ...errors] : result.errors,
              extensions: result.extensions,
            }
          } else if (remoteGraphQLIntercept) {
            try {
              result = await Promise.resolve(remoteGraphQLIntercept({
                operationName,
                variables,
                document,
                query,
                result,
                callCount: operationCount[operationName ?? 'unknown'],
                Response,
              }, testState, remoteGraphQLOptions ?? {}))
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

        if (String(url) === CYPRESS_REMOTE_MANIFEST_URL) {
          return new Response(JSON.stringify({
            name: 'Cypress',
            version: pkg.version,
          }), { status: 200 })
        }

        if (String(url) === NPM_CYPRESS_REGISTRY_URL) {
          return new Response(JSON.stringify({
            'time': {
              [pkg.version]: '2022-02-10T01:07:37.369Z',
            },
          }), { status: 200 })
        }

        return fetchApi(url, init)
      })

      return null
    },

    __internal_remoteGraphQLIntercept (args: {
      fn: string
      remoteGraphQLOptions?: Record<string, any>
    }) {
      remoteGraphQLOptions = args.remoteGraphQLOptions
      remoteGraphQLIntercept = new Function('console', 'obj', 'testState', 'remoteGraphQLOptions', `return (${args.fn})(obj, testState, remoteGraphQLOptions)`).bind(null, console) as RemoteGraphQLInterceptor

      return null
    },
    __internal_remoteGraphQLInterceptBatched (fn: string) {
      remoteGraphQLInterceptBatched = new Function('console', 'obj', 'testState', `return (${fn})(obj, testState)`).bind(null, console) as RemoteGraphQLBatchInterceptor

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
        e2eServerPort: ctx.coreData.servers.appServerPort,
      }
    },
    async __internal_openProject ({ argv, projectName }: InternalOpenProjectArgs): Promise<ResetOptionsResult> {
      let projectMatched = false

      for (const scaffoldedProject of scaffoldedProjects.keys()) {
        if (projectName.startsWith(scaffoldedProject)) {
          projectMatched = true
        }
      }

      if (!projectMatched) {
        throw new Error(`${projectName} has not been scaffolded. Be sure to call cy.scaffoldProject('${projectName}') in the test, a before, or beforeEach hook`)
      }

      let port = '4455'

      // If we're component testing, we need to set the port to something other than 4455 so that
      // the dev server can be running on something other than the special 4455 port
      if (argv.includes('--component')) {
        port = '4456'
      }

      const openArgv = [...argv, '--project', Fixtures.projectPath(projectName), '--port', port]

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
        e2eServerPort: ctx.coreData.servers.appServerPort,
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
