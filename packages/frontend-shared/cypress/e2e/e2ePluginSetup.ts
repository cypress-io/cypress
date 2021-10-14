import type { DataContext } from '@packages/data-context'
import * as inspector from 'inspector'
import sinonChai from '@cypress/sinon-chai'
import sinon from 'sinon'
import rimraf from 'rimraf'
import util from 'util'

// require'd so we don't conflict with globals loaded in @packages/types
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSubset = require('chai-subset')
const { expect } = chai

chai.use(chaiAsPromised)
chai.use(chaiSubset)
chai.use(sinonChai)

import path from 'path'
import type { WithCtxInjected, WithCtxOptions } from './support/e2eSupport'
import { e2eProjectDirs } from './support/e2eProjectDirs'

export async function e2ePluginSetup (projectRoot: string, on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
  // require'd so we don't import the types from @packages/server which would
  // pollute strict type checking
  const { runInternalServer } = require('@packages/server/lib/modes/internal-server')
  const Fixtures = require('../../../server/test/support/helpers/fixtures')
  const tmpDir = path.join(__dirname, '.projects')

  await util.promisify(rimraf)(tmpDir)

  Fixtures.setTmpDir(tmpDir)
  Fixtures.scaffold()

  interface WithCtxObj {
    fn: string
    options: WithCtxOptions
    activeTestId: string
  }

  let ctx: DataContext
  let serverPortPromise: Promise<number>
  let currentTestId: string | undefined
  let testState: Record<string, any> = {}

  on('task', {
    async withCtx (obj: WithCtxObj) {
      // Ensure we spin up a completely isolated server/state for each test
      if (obj.activeTestId !== currentTestId) {
        ctx?.destroy()
        currentTestId = obj.activeTestId
        testState = {};
        ({ serverPortPromise, ctx } = runInternalServer({
          projectRoot: null,
        }) as {ctx: DataContext, serverPortPromise: Promise<number>})

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
