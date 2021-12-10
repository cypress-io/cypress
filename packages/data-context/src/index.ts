import type { DataContext } from './DataContext'

export {
  DataContext,
} from './DataContext'

export type {
  DataContextConfig,
} from './DataContext'

export type {
  GlobalPubSub,
} from './globalPubSub'

import { globalPubSub } from './globalPubSub'

export { globalPubSub }

let ctx: DataContext | null = null

// globalPubSub.on('cleanup', clearCtx)

/**
 * Shouldn't ever be called from runtime code, primarily for test situations where we need to
 */
export function clearCtx () {
  ctx = null
}

/**
 * Gets the current DataContext, used in situations where it's too much work
 * to inject it deeply through the class hierearchy in legacy server code, but we
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
