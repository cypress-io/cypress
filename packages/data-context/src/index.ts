import type { DataContext } from './DataContext'

export { DocumentNodeBuilder } from './util/DocumentNodeBuilder'

export {
  DataContext,
} from './DataContext'

export type {
  DataContextConfig,
  GraphQLRequestInfo,
} from './DataContext'

export type {
  GlobalPubSub,
} from './globalPubSub'

export * from './util/pluginHandlers'

export { globalPubSub } from './globalPubSub'

let ctx: DataContext | null = null

export async function clearCtx () {
  if (ctx) {
    await ctx.lifecycleManager.mainProcessWillDisconnect()
    await ctx.destroy()
    ctx = null
  }
}

export function hasCtx () {
  return Boolean(ctx)
}

/**
 * Gets the current DataContext, used in situations where it's too much work
 * to inject it deeply through the class hierarchy in legacy server code, but we
 * need to reference it anyway, and for the time being we can assume
 * there's only one for the lifecycle of the Electron app.
 */
export function getCtx () {
  if (!ctx) {
    throw new Error(`
      Expected DataContext to already have been set via setCtx. If this is a
      testing context, make sure you are calling "setCtx" in a before hook,
      otherwise check the application flow.
    `)
  }

  return ctx
}

/**
 * Sets the current DataContext - happens at runtime when we startup Cypress
 * in "open" / "run" mode, or during testing in a beforeEach, when we clear the context
 */
export function setCtx (_ctx: DataContext) {
  if (ctx) {
    throw new Error(`
      The context has already been set. If this is occurring in a testing context,
      make sure you are clearing the context. Otherwise
    `)
  }

  ctx = _ctx

  return _ctx
}
