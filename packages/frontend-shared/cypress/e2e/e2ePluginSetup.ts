import path from 'path'
import type { RemoteGraphQLInterceptor, ResetLaunchArgsResult, WithCtxInjected, WithCtxOptions } from './support/e2eSupport'
import { e2eProjectDirs } from './support/e2eProjectDirs'
import type { CloudExecuteRemote } from '@packages/data-context/src/sources'
import type { DataContext } from '@packages/data-context'
import * as inspector from 'inspector'
import sinonChai from '@cypress/sinon-chai'
import sinon from 'sinon'
import rimraf from 'rimraf'
import util from 'util'
import fs from 'fs'
import { buildSchema, execute, GraphQLError, parse } from 'graphql'
import { Response } from 'cross-fetch'

import { CloudRunQuery } from '../support/mock-graphql/stubgql-CloudTypes'
import { getOperationName } from '@urql/core'

const cloudSchema = buildSchema(fs.readFileSync(path.join(__dirname, '../../../graphql/schemas/cloud.graphql'), 'utf8'))

// require'd so we don't conflict with globals loaded in @packages/types
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSubset = require('chai-subset')

const { expect } = chai

chai.use(chaiAsPromised)
chai.use(chaiSubset)
chai.use(sinonChai)

interface InternalResetLaunchArgs {
  argv: string[]
  projectName?: string
}

interface InternalAddProjectOpts {
  projectName: string
  open?: boolean
}

export async function e2ePluginSetup (projectRoot: string, on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
  delete process.env.CYPRESS_INTERNAL_GRAPHQL_PORT
  delete process.env.CYPRESS_INTERNAL_VITE_DEV
  delete process.env.CYPRESS_INTERNAL_VITE_APP_PORT
  delete process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT
  // require'd so we don't import the types from @packages/server which would
  // pollute strict type checking
  const { runInternalServer } = require('@packages/server/lib/modes/internal-server')
  const Fixtures = require('@tooling/system-tests/lib/fixtures')
  const cli = require('../../../../cli/lib/cli')
  const cliOpen = require('../../../../cli/lib/exec/open')
  const tmpDir = path.join(__dirname, '.projects')
  const argUtils = require('@packages/server/lib/util/args')

  await util.promisify(rimraf)(tmpDir)

  Fixtures.setTmpDir(tmpDir)

  interface WithCtxObj {
    fn: string
    options: WithCtxOptions
    // TODO(tim): add an API for intercepting this
    interceptCloudExecute: (config: CloudExecuteRemote) => {}
  }

  let ctx: DataContext
  let gqlPort: number
  let testState: Record<string, any> = {}
  let remoteGraphQLIntercept: RemoteGraphQLInterceptor | undefined

  on('task', {
    /**
     * Called before each test to do global setup/cleanup
     */
    async __internal__beforeEach () {
      testState = {}
      await ctx?.destroy()
      sinon.reset()
      remoteGraphQLIntercept = undefined;

      ({ gqlPort, ctx } = await runInternalServer({
        projectRoot: null,
      }, 'open') as {ctx: DataContext, gqlPort: number })

      const fetchApi = ctx.util.fetch

      await ctx.actions.applicationData.removeAppDir()
      await ctx.actions.applicationData.ensureAppDirExists()

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

      return {
        gqlPort,
      }
    },
    __internal_remoteGraphQLIntercept (fn: string) {
      remoteGraphQLIntercept = new Function('console', 'obj', `return (${fn})(obj)`).bind(null, console) as RemoteGraphQLInterceptor

      return null
    },
    async __internal_addProject (opts: InternalAddProjectOpts) {
      Fixtures.scaffoldProject(opts.projectName)

      await ctx.actions.globalProject?.addProject({ path: Fixtures.projectPath(opts.projectName), open: opts.open })

      return Fixtures.projectPath(opts.projectName)
    },
    async __internal_resetLaunchArgs ({ argv, projectName }: InternalResetLaunchArgs): Promise<ResetLaunchArgsResult> {
      const openArgv = projectName && !argv.includes('--project') ? ['--project', Fixtures.projectPath(projectName), ...argv] : ['--global', ...argv]

      // Runs the launchArgs through the whole pipeline for the CLI open process,
      // which probably needs a bit of refactoring / consolidating
      const cliOptions = await cli.parseOpenCommand(['open', ...openArgv])
      const processedArgv = cliOpen.processOpenOptions(cliOptions)
      const finalLaunchArgs = argUtils.toObject(processedArgv)

      // Reset the state of the context
      ctx.resetLaunchArgs(finalLaunchArgs)

      // Handle any pre-loading that should occur based on the launch arg settings
      await ctx.initializeMode()

      return {
        launchArgs: finalLaunchArgs,
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

          return path.join(tmpDir, projectName)
        },
      }

      const val = await Promise.resolve(new Function('ctx', 'options', 'chai', 'expect', 'sinon', `
        return (${obj.fn})(ctx, options, chai, expect, sinon)
      `).call(undefined, ctx, options, chai, expect, sinon))

      return val || null
    },
  })

  return {
    ...config,
    env: {
      e2e_isDebugging: Boolean(inspector.url()),
    },
  }
}
