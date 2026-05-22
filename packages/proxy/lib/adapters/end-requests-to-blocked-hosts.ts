import { telemetry } from '@packages/telemetry'
import type { RunPoliciesResult } from '@packages/network-interception'
import { isVerboseTelemetry as isVerbose } from '../http'
import type { RequestInterceptionMiddlewareCtx } from './types'

/**
 * Evaluate configurator request policies (e.g. blocked-hosts) and end the request when matched.
 */
export async function endRequestsToBlockedHosts (
  mw: RequestInterceptionMiddlewareCtx,
  runPolicies: () => Promise<RunPoliciesResult>,
): Promise<void> {
  const span = telemetry.startSpan({ name: 'end:requests:to:block:hosts', parentSpan: mw.reqMiddlewareSpan, isVerbose })

  const result = await runPolicies()
  const blockedHostMatch = result.state.blockedHostMatch

  span?.setAttributes({
    areBlockHostsConfigured: result.ended || !!blockedHostMatch,
    didUrlMatchBlockedHosts: !!blockedHostMatch,
  })

  if (result.ended && blockedHostMatch) {
    mw.res.set('x-cypress-matched-blocked-host', blockedHostMatch as string)
    mw.debug('blocking request %o', { matches: blockedHostMatch })

    mw.res.status(503).end()

    span?.end()

    return mw.end()
  }

  span?.end()
  mw.next()
}
