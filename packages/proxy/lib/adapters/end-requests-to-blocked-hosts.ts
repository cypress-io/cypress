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

  span?.setAttributes({
    areBlockHostsConfigured: !!mw.config.blockHosts,
  })

  const result = await runPolicies()
  const blockedHostMatch = result.state.blockedHostMatch

  if (blockedHostMatch) {
    span?.setAttributes({
      didUrlMatchBlockedHosts: true,
    })
  }

  if (result.ended) {
    if (blockedHostMatch) {
      mw.res.set('x-cypress-matched-blocked-host', blockedHostMatch as string)
      mw.debug('blocking request %o', { matches: blockedHostMatch })

      mw.res.status(503).end()
    } else {
      mw.debug('request ended by policy without blockedHostMatch %o', { state: result.state })
      span?.end()

      return mw.next()
    }

    span?.end()

    return mw.end()
  }

  span?.end()
  mw.next()
}
