import { telemetry } from '@packages/telemetry'
import { getSameSiteContext, shouldAttachAndSetCookies, addCookieJarCookiesToRequest } from '../http/util/cookies'
import { doesTopNeedToBeSimulated } from '../http/util/top-simulation'
import { isVerboseTelemetry as isVerbose } from '../http'
import * as errors from '@packages/errors'
import type { RequestInterceptionMiddlewareCtx } from './types'

/**
 * Attach cross-origin cookies from the server-side cookie jar to proxied requests.
 */
export function attachCrossOriginCookies (mw: RequestInterceptionMiddlewareCtx): void {
  const span = telemetry.startSpan({ name: 'maybe:attach:cross:origin:cookies', parentSpan: mw.reqMiddlewareSpan, isVerbose })

  const doesTopNeedSimulation = doesTopNeedToBeSimulated(mw)

  span?.setAttributes({
    doesTopNeedToBeSimulated: doesTopNeedSimulation,
    resourceType: mw.req.resourceType,
  })

  if (!doesTopNeedSimulation) {
    span?.end()

    return mw.next()
  }

  if (mw.req.isSyncRequest) {
    errors.warning('SYNCHRONOUS_XHR_REQUEST_COOKIES_NOT_APPLIED', mw.req.proxiedUrl)
  }

  // Top needs to be simulated since the AUT is in a cross origin state. Get the "requested with" and credentials and see what cookies need to be attached
  const currentAUTUrl = mw.getAUTUrl()
  const shouldCookiesBeAttachedToRequest = shouldAttachAndSetCookies(mw.req.proxiedUrl, currentAUTUrl, mw.req.resourceType, mw.req.credentialsLevel, mw.req.isAUTFrame)

  span?.setAttributes({
    currentAUTUrl,
    shouldCookiesBeAttachedToRequest,
  })

  mw.debug(`should cookies be attached to request?: ${shouldCookiesBeAttachedToRequest}`)
  if (!shouldCookiesBeAttachedToRequest) {
    span?.end()

    return mw.next()
  }

  const sameSiteContext = getSameSiteContext(
    currentAUTUrl,
    mw.req.proxiedUrl,
    mw.req.isAUTFrame,
  )

  span?.setAttributes({
    sameSiteContext,
    currentAUTUrl,
    isAUTFrame: mw.req.isAUTFrame,
  })

  const applicableCookiesInCookieJar = mw.getCookieJar().getCookies(mw.req.proxiedUrl, sameSiteContext)
  const cookiesOnRequest = (mw.req.headers['cookie'] || '').split('; ')

  const existingCookiesInJar = applicableCookiesInCookieJar.join('; ')
  const addedCookiesFromHeader = cookiesOnRequest.join('; ')

  mw.debug('existing cookies on request from cookie jar: %s', existingCookiesInJar)
  mw.debug('add cookies to request from header: %s', addedCookiesFromHeader)

  // if the cookie header is empty (i.e. ''), set it to undefined for expected behavior
  mw.req.headers['cookie'] = addCookieJarCookiesToRequest(applicableCookiesInCookieJar, cookiesOnRequest) || undefined

  span?.setAttributes({
    existingCookiesInJar,
    addedCookiesFromHeader,
    cookieHeader: mw.req.headers['cookie'],
  })

  mw.debug('cookies being sent with request: %s', mw.req.headers['cookie'])

  span?.end()
  mw.next()
}
