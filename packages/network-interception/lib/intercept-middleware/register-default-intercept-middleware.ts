import type { ForHttpIntercept } from '../ports/http-interception'
import { HttpIntercept } from '../core/http-intercept'
import type { DocumentRewriteConfig } from '../config/document-rewrite'
import type { BlockedHostsConfig } from './blocked-hosts-intercept-middleware'
import { createBlockedHostsInterceptMiddleware } from './blocked-hosts-intercept-middleware'
import { createCspAllowListInterceptMiddleware } from './csp-allow-list-intercept-middleware'

export type RegisterDefaultInterceptMiddlewareConfig = DocumentRewriteConfig & {
  blockHosts?: string | string[] | null
  experimentalCspAllowList?: boolean | string[] | null
}

export type RegisterDefaultInterceptMiddlewareDeps = {
  matchesBlockedHost: NonNullable<BlockedHostsConfig['matchesBlockedHost']>
}

/**
 * Register config-driven middleware on {@link HttpIntercept} at the composition root.
 *
 * Order: BlockHosts (outer) → CSP allow-list → cy.intercept interceptor (inner, DriverAdapter).
 *
 * `DocumentRewriteConfig` fields are listed for composition-root typing only; enforcement
 * stays on proxy response middleware (`ForDocumentPreparation` via `ProxyNetworkServices`).
 */
export function registerDefaultInterceptMiddleware (
  httpIntercept: ForHttpIntercept,
  config: RegisterDefaultInterceptMiddlewareConfig,
  deps: RegisterDefaultInterceptMiddlewareDeps,
): void {
  httpIntercept.use(createBlockedHostsInterceptMiddleware({
    config,
    matchesBlockedHost: deps.matchesBlockedHost,
  }))

  httpIntercept.use(createCspAllowListInterceptMiddleware(config))
}

export function createHttpInterceptWithDefaultMiddleware (
  config: RegisterDefaultInterceptMiddlewareConfig,
  deps: RegisterDefaultInterceptMiddlewareDeps,
): HttpIntercept {
  const httpIntercept = new HttpIntercept()

  registerDefaultInterceptMiddleware(httpIntercept, config, deps)

  return httpIntercept
}
