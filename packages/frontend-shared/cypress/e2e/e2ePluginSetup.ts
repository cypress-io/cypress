import type { DataContext } from '@packages/data-context'
import * as inspector from 'inspector'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiSubset from 'chai-subset'
import sinonChai from '@cypress/sinon-chai'
import sinon from 'sinon'

chai.use(chaiAsPromised)
chai.use(chaiSubset)
chai.use(sinonChai)

import type { WithCtxOptions } from './support/e2eSupport'

export async function e2ePluginSetup (projectRoot: string, on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  // require'd so we don't import the types from @packages/server which would
  // pollute strict type checking
  const { runInternalServer } = require('@packages/server/lib/modes/internal-server')

  process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
  const { serverPortPromise, ctx } = runInternalServer({
    projectRoot,
  }) as {ctx: DataContext, serverPortPromise: Promise<number>}

  interface WithCtxObj {
    fn: string
    options: WithCtxOptions
    activeTestId: string
  }

  let currentTestId: string | undefined
  let testState: Record<string, any> = {}

  on('task', {
    async withCtx (obj: WithCtxObj) {
      await serverPortPromise

      if (obj.activeTestId !== currentTestId) {
        currentTestId = obj.activeTestId
        testState = {}
      }

      const val = await Promise.resolve(new Function('ctx', 'options', 'chai', 'expect', 'sinon', `return (${obj.fn})(ctx, options, chai, expect, sinon)`).call(undefined, ctx, {
        ...obj.options,
        testState,
        require,
        process,
      }, chai, expect, sinon))

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
