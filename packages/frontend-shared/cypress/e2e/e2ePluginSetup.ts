import { runInternalServer } from '@packages/server/lib/modes/internal-server'

export async function e2ePluginSetup (projectRoot: string, on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  const { serverPortPromise, ctx } = runInternalServer({
    projectRoot,
  })

  on('task', {
    withCtx (fnString: string) {
      return new Function('ctx', `return (${fnString})(ctx)`).call(undefined, ctx)
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
