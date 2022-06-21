import _ from 'lodash'
import type Debug from 'debug'
import { URL } from 'url'
import { cors } from '@packages/network'
import { Cookie, CookieJar } from '@packages/server/lib/cookie-jar'

interface AutomationCookie {
  domain: string
  expiry: number | null
  httpOnly: boolean
  maxAge: number | null
  name: string
  path: string | null
  sameSite: string
  secure: boolean
  value: string
}

interface RequestDetails {
  url: string
  isAUTFrame: boolean
  needsCrossOriginHandling: boolean
}

// Sets SameSite context to match what it would be in the browser
// see https://github.com/salesforce/tough-cookie#samesite-cookies
export const getSameSiteContext = (autUrl: string | undefined, requestUrl: string, isAUTFrameRequest: boolean) => {
  // if there's no AUT URL, it's a request for the first URL visited,
  // so there would be no cross-origin concerns
  // if the request origin matches the AUT origin, cookies can be handled
  // in a strict fashion
  if (!autUrl || cors.urlOriginsMatch(autUrl, requestUrl)) {
    return 'strict'
  }

  // being an AUT frame request means it's from navigation, so the context is
  // 'lax'. otherwise, 'none' indicates a non-navigation cross-origin request
  return isAUTFrameRequest ? 'lax' : 'none'
}

const sameSiteNoneRe = /; +samesite=(?:'none'|"none"|none)/i

export const parseCookie = (cookie) => {
  const toughCookie = CookieJar.parse(cookie)

  if (!toughCookie) return

  // fixes tough-cookie defaulting undefined/invalid SameSite to 'none'
  // https://github.com/salesforce/tough-cookie/issues/191
  const hasUnspecifiedSameSite = toughCookie.sameSite === 'none' && !sameSiteNoneRe.test(cookie)

  // not all browsers currently default to lax, but they're heading in that
  // direction since it's now the standard, so this is more future-proof
  if (hasUnspecifiedSameSite) {
    toughCookie.sameSite = 'lax'
  }

  return toughCookie
}

const comparableCookieString = (toughCookie) => {
  return _(toughCookie)
  .pick('key', 'value', 'domain', 'path')
  .toPairs()
  .sortBy(([key]) => key)
  .map(([key, value]) => `${key}=${value}`)
  .join('; ')
}

const areCookiesEqual = (cookieA, cookieB) => {
  return comparableCookieString(cookieA) === comparableCookieString(cookieB)
}

const matchesPreviousCookie = (previousCookies, cookie) => {
  return !!previousCookies.find((previousCookie) => {
    return areCookiesEqual(previousCookie, cookie)
  })
}

const toughCookieToAutomationCookie = (toughCookie, defaultDomain) => {
  const expiry = toughCookie.expiryTime()

  return {
    domain: toughCookie.domain || defaultDomain,
    expiry: isFinite(expiry) ? expiry / 1000 : null,
    httpOnly: toughCookie.httpOnly,
    maxAge: toughCookie.maxAge,
    name: toughCookie.key,
    path: toughCookie.path,
    sameSite: toughCookie.sameSite === 'none' ? 'no_restriction' : toughCookie.sameSite,
    secure: toughCookie.secure,
    value: toughCookie.value,
  }
}

export class CookiesHelper {
  cookieJar: CookieJar
  currentAUTUrl: string | undefined
  request: RequestDetails
  debug: Debug.Debugger
  defaultDomain: string
  sameSiteContext: 'strict' | 'lax' | 'none'
  previousCookies: Cookie[] = []

  constructor ({ cookieJar, currentAUTUrl, request, debug }) {
    this.cookieJar = cookieJar
    this.currentAUTUrl = currentAUTUrl
    this.request = request
    this.debug = debug
    this.sameSiteContext = getSameSiteContext(currentAUTUrl, request.url, request.isAUTFrame)

    const parsedRequestUrl = new URL(request.url)

    this.defaultDomain = parsedRequestUrl.hostname
  }

  async capturePreviousCookies () {
    // this plays a part in adding cross-origin cookies to the browser via
    // automation. if the request doesn't need cross-origin handling, this
    // is a noop
    if (!this.request.needsCrossOriginHandling) return

    this.previousCookies = this.cookieJar.getAllCookies()
  }

  async getAddedCookies () {
    // this plays a part in adding cross-origin cookies to the browser via
    // automation. if the request doesn't need cross-origin handling, this
    // is a noop
    if (!this.request.needsCrossOriginHandling) return []

    const afterCookies = this.cookieJar.getAllCookies()

    return afterCookies.reduce<AutomationCookie[]>((memo, afterCookie) => {
      if (matchesPreviousCookie(this.previousCookies, afterCookie)) return memo

      return memo.concat(toughCookieToAutomationCookie(afterCookie, this.defaultDomain))
    }, [])
  }

  setCookie (cookie: string) {
    const toughCookie = parseCookie(cookie)

    // don't set the cookie in our own cookie jar if the parsed cookie is
    // undefined (meaning it's invalid) or if the browser would not set it
    // because Secure is required for SameSite=None. not all browsers currently
    // currently enforce this, but they're heading in that direction since
    // it's now the standard, so this is more future-proof
    if (!toughCookie || (toughCookie.sameSite === 'none' && !toughCookie.secure)) {
      return
    }

    try {
      this.cookieJar.setCookie(toughCookie, this.request.url, this.sameSiteContext)
    } catch (err) {
      this.debug('adding cookie to jar failed: %s', err.message)
    }
  }
}
