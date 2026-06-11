import { URL } from 'url'
import { telemetry } from '@packages/telemetry'
import { toughCookieToAutomationCookie } from '@packages/server/lib/util/cookies'
import { CookiesHelper } from '../http/util/cookies'
import { doesTopNeedToBeSimulated } from '../http/util/top-simulation'
import { isVerboseTelemetry as isVerbose } from '../http'
import * as errors from '@packages/errors'
import type { ResponseInterceptionMiddlewareCtx } from './types'

const CROSS_ORIGIN_COOKIES_RECEIVED_LOG_TIMEOUT_MS = 5000

function setSimulatedCookies (mw: ResponseInterceptionMiddlewareCtx) {
  if (mw.res.wantsInjection !== 'fullCrossOrigin') return

  const defaultDomain = (new URL(mw.req.proxiedUrl)).hostname
  const allCookiesForRequest = mw.getCookieJar()
  .getCookies(mw.req.proxiedUrl)
  .map((cookie) => toughCookieToAutomationCookie(cookie, defaultDomain))

  mw.simulatedCookies = allCookiesForRequest
}

/**
 * Capture Set-Cookie headers into the server-side cookie jar and browser automation.
 */
export async function copyCookiesFromResponse (mw: ResponseInterceptionMiddlewareCtx): Promise<void> {
  const span = telemetry.startSpan({ name: 'maybe:copy:cookies:from:incoming:res', parentSpan: mw.resMiddlewareSpan, isVerbose })

  const cookies: string | string[] | undefined = mw.incomingRes.headers['set-cookie']

  const areCookiesAbsent = !cookies || !cookies.length

  span?.setAttributes({
    areCookiesAbsent,
  })

  if (areCookiesAbsent) {
    setSimulatedCookies(mw)

    span?.end()

    return mw.next()
  }

  // Simulated Top Cookie Handling
  // ---------------------------
  // - We capture cookies sent by responses and add them to our own server-side
  //   tough-cookie cookie jar. All request cookies are captured, since any
  //   future request could be cross-origin in the context of top, even if the response that sets them
  //   is not.
  // - If we sent the cookie header, it may fail to be set by the browser
  //   (in most cases). However, we cannot determine all the cases in which Set-Cookie
  //   will currently fail. We try to address this in our tough cookie jar
  //   by only setting cookies that would otherwise work in the browser if the AUT url was top
  // - We also set the cookies through automation so they are available in the
  //   browser via document.cookie and via Cypress cookie APIs
  //   (e.g. cy.getCookie). This is only done when the AUT url and top do not match responses,
  //   since AUT and Top being same origin will be successfully set in the browser
  //   automatically as expected.
  // - In the request middleware, we retrieve the cookies for a given URL
  //   and attach them to the request, like the browser normally would.
  //   tough-cookie handles retrieving the correct cookies based on domain,
  //   path, etc. It also removes cookies from the cookie jar if they've expired.
  const doesTopNeedSimulating = doesTopNeedToBeSimulated(mw)

  span?.setAttributes({
    doesTopNeedSimulating,
  })

  const appendCookie = (cookie: string) => {
    // always call 'Set-Cookie' in the browser as cross origin or same site requests
    // can effectively set cookies in the browser if given correct credential permissions
    const headerName = 'Set-Cookie'

    try {
      mw.res.append(headerName, cookie)
    } catch (err) {
      mw.debug(`failed to append header ${headerName}, continuing %o`, { err, cookie })
    }
  }

  const cookiesHelper = new CookiesHelper({
    cookieJar: mw.getCookieJar(),
    currentAUTUrl: mw.getAUTUrl(),
    debug: mw.debug,
    request: {
      url: mw.req.proxiedUrl,
      isAUTFrame: mw.req.isAUTFrame,
      doesTopNeedSimulating,
      resourceType: mw.req.resourceType,
      credentialLevel: mw.req.credentialsLevel,
    },
  })

  await cookiesHelper.capturePreviousCookies()

  // Record the response's cookies in our server-side cookie jar (subject to the
  // same rules the browser would apply via `CookiesHelper.setCookie`) and append
  // them to the response so the browser sets them too. We update the jar even
  // when top does not need to be simulated: otherwise a same-origin XHR/fetch
  // that sets a cookie would update the browser but not the jar, leaving the jar
  // stale. A later top-level navigation reads from the jar and would overwrite
  // the request's fresh cookie with the stale value.
  // See https://github.com/cypress-io/cypress/issues/25841
  ;([] as string[]).concat(cookies).forEach((cookie) => {
    cookiesHelper.setCookie(cookie)

    appendCookie(cookie)
  })

  // When top does not need to be simulated, the AUT is the primary super domain
  // origin and the browser sets the response's cookies itself, so there's no
  // need to sync cookies into the browser via automation. The server-side cookie
  // jar has already been kept in sync above.
  if (!doesTopNeedSimulating) {
    span?.end()

    return mw.next()
  }

  setSimulatedCookies(mw)

  const addedCookies = await cookiesHelper.getAddedCookies()
  const wereSimCookiesAdded = addedCookies.length

  span?.setAttributes({
    wereSimCookiesAdded,
  })

  if (!wereSimCookiesAdded) {
    span?.end()

    return mw.next()
  }

  // if the request is sync, we cannot wait on the cross:origin:cookies:received
  // event since the sync request is blocking. This means that the cross-origin cookies
  // may not have been applied.
  if (mw.req.isSyncRequest) {
    errors.warning('SYNCHRONOUS_XHR_REQUEST_COOKIES_NOT_SET', mw.req.proxiedUrl)

    span?.end()

    return mw.next()
  }

  const cookiesEmittedAt = Date.now()
  let cookiesReceivedLogTimeout: NodeJS.Timeout | undefined

  // this wait has no timeout; when debug logging is enabled, log if the
  // event has not arrived after CROSS_ORIGIN_COOKIES_RECEIVED_LOG_TIMEOUT_MS
  // (the response remains held until the event arrives)
  if (mw.debug.enabled) {
    cookiesReceivedLogTimeout = setTimeout(() => {
      mw.debug('cross:origin:cookies:received has not been received within %dms of emitting cross:origin:cookies for url %s', CROSS_ORIGIN_COOKIES_RECEIVED_LOG_TIMEOUT_MS, mw.req.proxiedUrl)
    }, CROSS_ORIGIN_COOKIES_RECEIVED_LOG_TIMEOUT_MS)

    cookiesReceivedLogTimeout.unref?.()
  }

  // we want to set the cookies via automation so they exist in the browser
  // itself. however, firefox will hang if we try to use the extension
  // to set cookies on a url that's in-flight, so we send the cookies down to
  // the driver, let the response go, and set the cookies via automation
  // from the driver once the page has loaded but before we run any further
  // commands
  mw.serverBus.once('cross:origin:cookies:received', () => {
    if (cookiesReceivedLogTimeout) {
      clearTimeout(cookiesReceivedLogTimeout)
    }

    mw.debug('cross:origin:cookies:received %dms after emitting cross:origin:cookies for url %s', Date.now() - cookiesEmittedAt, mw.req.proxiedUrl)

    span?.end()
    mw.next()
  })

  mw.debug('emitting cross:origin:cookies with %d cookie(s) for url %s', addedCookies.length, mw.req.proxiedUrl)

  mw.serverBus.emit('cross:origin:cookies', addedCookies)
}
