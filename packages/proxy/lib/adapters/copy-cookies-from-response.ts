import { URL } from 'url'
import { telemetry } from '@packages/telemetry'
import { toughCookieToAutomationCookie } from '@packages/server/lib/util/cookies'
import { CookiesHelper } from '../http/util/cookies'
import { doesTopNeedToBeSimulated } from '../http/util/top-simulation'
import { isVerboseTelemetry as isVerbose } from '../http'
import * as errors from '@packages/errors'
import type { ResponseInterceptionMiddlewareCtx } from './types'

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

  const areCookiesPresent = !cookies || !cookies.length

  span?.setAttributes({
    areCookiesPresent,
  })

  if (areCookiesPresent) {
    setSimulatedCookies(mw)

    span?.end()

    return mw.next()
  }

  const doesTopNeedSimulating = doesTopNeedToBeSimulated(mw)

  span?.setAttributes({
    doesTopNeedSimulating,
  })

  const appendCookie = (cookie: string) => {
    const headerName = 'Set-Cookie'

    try {
      mw.res.append(headerName, cookie)
    } catch (err) {
      mw.debug(`failed to append header ${headerName}, continuing %o`, { err, cookie })
    }
  }

  if (!doesTopNeedSimulating) {
    ([] as string[]).concat(cookies).forEach((cookie) => {
      appendCookie(cookie)
    })

    span?.end()

    return mw.next()
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

  ;([] as string[]).concat(cookies).forEach((cookie) => {
    cookiesHelper.setCookie(cookie)

    appendCookie(cookie)
  })

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

  if (mw.req.isSyncRequest) {
    errors.warning('SYNCHRONOUS_XHR_REQUEST_COOKIES_NOT_SET', mw.req.proxiedUrl)

    span?.end()

    return mw.next()
  }

  mw.serverBus.once('cross:origin:cookies:received', () => {
    span?.end()
    mw.next()
  })

  mw.serverBus.emit('cross:origin:cookies', addedCookies)
}
