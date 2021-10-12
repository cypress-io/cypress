import type { DataContext } from '@packages/data-context'

export async function e2ePluginSetup (projectRoot: string, on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  // require'd so we don't import the types from @packages/server which would
  // pollute strict type checking
  const { runInternalServer } = require('@packages/server/lib/modes/internal-server')

  process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
  const { serverPortPromise, ctx } = runInternalServer({
    projectRoot,
  }) as {ctx: DataContext, serverPortPromise: Promise<number>}

  on('task', {
    async withCtx (fnString: string) {
      await serverPortPromise

      return new Function('ctx', `return (${fnString})(ctx)`).call(undefined, ctx)
    },
    async resetCtxState () {
      return ctx.dispose()
    },
    async visitLaunchpad () {

    },
    async visitApp () {

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
