import { blocked } from '@packages/network'
import { createHttpInterceptWithDefaultMiddleware } from '@packages/network-interception'
import type { ForHttpIntercept, RegisterDefaultInterceptMiddlewareConfig } from '@packages/network-interception'
import { CyIntercept, INTERCEPT_HEADERS } from '@packages/net-stubbing'
import type { SocketBroadcaster } from '@packages/socket'
import { createStripInternalHeaders } from './strip-internal-headers'

export type ComposeInterceptStackConfig = RegisterDefaultInterceptMiddlewareConfig & {
  devServerPublicPathRoute?: string
}

export type ComposeInterceptStackOptions = {
  config: ComposeInterceptStackConfig
  socket: SocketBroadcaster
  onSyncInterceptSkipped?: (url: string) => void
}

export type ComposedInterceptStack = {
  httpIntercept: ForHttpIntercept
  cyIntercept: CyIntercept
}

/**
 * Server composition root for the HTTP intercept middleware stack.
 *
 * Order (outer → inner): blocked hosts → CSP allow-list → strip internal headers → cy.intercept.
 */
export function composeInterceptStack (options: ComposeInterceptStackOptions): ComposedInterceptStack {
  const httpIntercept = createHttpInterceptWithDefaultMiddleware(options.config, {
    matchesBlockedHost: blocked.matches,
  })

  httpIntercept.use(createStripInternalHeaders(INTERCEPT_HEADERS))

  const cyIntercept = new CyIntercept({
    socket: options.socket,
    onSyncInterceptSkipped: options.onSyncInterceptSkipped,
    config: {
      devServerPublicPathRoute: options.config.devServerPublicPathRoute,
      exclusionHeaders: INTERCEPT_HEADERS,
    },
  })

  httpIntercept.use(cyIntercept.middleware)

  return { httpIntercept, cyIntercept }
}
