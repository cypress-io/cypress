import type { DataContext } from '@packages/data-context'
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
  }

  on('task', {
    async withCtx (obj: WithCtxObj) {
      await serverPortPromise

      const val = await Promise.resolve(new Function('ctx', 'options', `return (${obj.fn})(ctx, options)`).call(undefined, ctx, obj.options ?? {}))

      return val || null
    },
    async resetCtxState () {
      return ctx.dispose()
    },
    getGraphQLPort () {
      return serverPortPromise
    },
    getAppServerPort () {
      return ctx.appServerPort ?? null
    },
  })

  return config
}
