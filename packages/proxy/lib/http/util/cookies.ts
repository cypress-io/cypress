import _ from 'lodash'
import type Debug from 'debug'
import { URL } from 'url'
import { cors } from '@packages/network'
import { AutomationCookie, Cookie, CookieJar, toughCookieToAutomationCookie } from '@packages/server/lib/util/cookies'

interface RequestDetails {
  url: string
  isAUTFrame: boolean
  needsCrossOriginHandling: boolean
}

/**
 * Whether or not a url's scheme, domain, and top-level domain match to determine whether or not
 * a cookie is considered first-party. See https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#third-party_cookies
 * for more details.
 * @param {string} url1 - the first url
 * @param {string} url2 - the second url
 * @returns {boolean} whether or not the URL Scheme, Domain, and TLD match. This is called same-site and
 * is allowed to have a different port or subdomain. @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site#directives
 * for more details.
 */
export const areUrlsSameSite = (url1: string, url2: string) => {
  if (!url1 || !url2) return false

  const { port: port1, ...parsedUrl1 } = cors.parseUrlIntoDomainTldPort(url1)
  const { port: port2, ...parsedUrl2 } = cors.parseUrlIntoDomainTldPort(url2)

  // If HTTPS, ports NEED to match. Otherwise, HTTP ports can be different and are same origin
  const doPortsPassSameSchemeCheck = port1 !== port2 ? (port1 !== '443' && port2 !== '443') : true

  return doPortsPassSameSchemeCheck && _.isEqual(parsedUrl1, parsedUrl2)
}

export const addCookieJarCookiesToRequest = (applicableCookieJarCookies: Cookie[] = [], requestCookieStringArray: string[] = []): string => {
  const cookieMap = new Map<string, Cookie>()
  const requestCookies: Cookie[] = requestCookieStringArray.map((cookie) => CookieJar.parse(cookie)).filter((cookie) => cookie !== undefined) as Cookie[]

  // Always have cookies in the jar overwrite cookies in the request if they are the same
  requestCookies.forEach((cookie) => cookieMap.set(cookie.key, cookie))
  // Two or more cookies on the same request can happen per https://www.rfc-editor.org/rfc/rfc6265
  // But if a value for that cookie already exists in the cookie jar, do NOT add the cookie jar cookie
  applicableCookieJarCookies.forEach((cookie) => {
    if (cookieMap.get(cookie.key)) {
      cookieMap.delete(cookie.key)
    }
  })

  const requestCookiesThatNeedToBeAdded = Array.from(cookieMap).map(([key, cookie]) => cookie)

  return applicableCookieJarCookies.concat(requestCookiesThatNeedToBeAdded).map((cookie) => cookie.cookieString()).join('; ')
}

// sameSiteContext is a concept for tough-cookie's cookie jar that helps it
// simulate what a browser would do when determining whether or not it should
// be set from a response or a attached to a response. it shouldn't be confused
// with a cookie's SameSite property, though that also plays a role when
// setting/getting a cookie from the tough-cookie cookie jar. see tough-cookie's
// own explanation of sameSiteContext for more information:
// see https://github.com/salesforce/tough-cookie#samesite-cookies
export const getSameSiteContext = (autUrl: string | undefined, requestUrl: string, isAUTFrameRequest: boolean) => {
  // if there's no AUT URL, it's a request for the first URL visited, or if
  // the request origin is considered the same site as the AUT origin;
  // both indicate that it's not a cross-site request
  if (!autUrl || areUrlsSameSite(autUrl, requestUrl)) {
    return 'strict'
  }

  // being an AUT frame request means it's via top-level navigation, and we've
  // ruled out same-origin navigation, so the context is 'lax'.
  // anything else is a non-navigation, cross-site request
  return isAUTFrameRequest ? 'lax' : 'none'
}

const comparableCookieString = (toughCookie: Cookie): string => {
  return _(toughCookie)
  .pick('key', 'value', 'domain', 'path')
  .toPairs()
  .sortBy(([key]) => key)
  .map(([key, value]) => `${key}=${value}`)
  .join('; ')
}

const areCookiesEqual = (cookieA: Cookie, cookieB: Cookie) => {
  return comparableCookieString(cookieA) === comparableCookieString(cookieB)
}

const matchesPreviousCookie = (previousCookies: Cookie[], cookie: Cookie) => {
  return !!previousCookies.find((previousCookie) => {
    return areCookiesEqual(previousCookie, cookie)
  })
}

/**
 * Utility for dealing with cross-origin cookies
 * - Tracks which cookies were added to our server-side cookie jar during
 *   a request, so they can be added to the browser via automation
 * - Provides utility cookie-handling methods that rely on aspects of the
 *   request (url, previous request url, etc)
 */
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

  capturePreviousCookies () {
    // this plays a part in adding cross-origin cookies to the browser via
    // automation. if the request doesn't need cross-origin handling, this
    // is a noop
    if (!this.request.needsCrossOriginHandling) return

    this.previousCookies = this.cookieJar.getAllCookies()
  }

  getAddedCookies () {
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
    const toughCookie = CookieJar.parse(cookie)

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
