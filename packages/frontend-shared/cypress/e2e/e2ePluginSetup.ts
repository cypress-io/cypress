import path from 'path'
import type { RemoteGraphQLInterceptor, WithCtxInjected, WithCtxOptions } from './support/e2eSupport'
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

export async function e2ePluginSetup (projectRoot: string, on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
  // require'd so we don't import the types from @packages/server which would
  // pollute strict type checking
  const { runInternalServer } = require('@packages/server/lib/modes/internal-server')
  const Fixtures = require('@tooling/system-tests/lib/fixtures')
  const tmpDir = path.join(__dirname, '.projects')

  await util.promisify(rimraf)(tmpDir)

  Fixtures.setTmpDir(tmpDir)

  interface WithCtxObj {
    fn: string
    options: WithCtxOptions
    activeTestId: string
    // TODO(tim): add an API for intercepting this
    interceptCloudExecute: (config: CloudExecuteRemote) => {}
  }

  let ctx: DataContext
  let serverPortPromise: Promise<number>
  let currentTestId: string | undefined
  let testState: Record<string, any> = {}
  let remoteGraphQLIntercept: RemoteGraphQLInterceptor | undefined

  on('task', {
    remoteGraphQLIntercept (fn: string) {
      remoteGraphQLIntercept = new Function('console', 'obj', `return (${fn})(obj)`).bind(null, console) as RemoteGraphQLInterceptor

      return null
    },
    scaffoldProject (projectName: string) {
      Fixtures.scaffoldProject(projectName)

      return Fixtures.projectPath(projectName)
    },
    async withCtx (obj: WithCtxObj) {
      // Ensure we spin up a completely isolated server/state for each test
      if (obj.activeTestId !== currentTestId) {
        await ctx?.destroy()
        currentTestId = obj.activeTestId
        remoteGraphQLIntercept = undefined
        testState = {};
        ({ serverPortPromise, ctx } = runInternalServer({
          projectRoot: null,
        }, {
          loadCachedProjects: false,
        }) as {ctx: DataContext, serverPortPromise: Promise<number> })

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

        await serverPortPromise
      }

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
