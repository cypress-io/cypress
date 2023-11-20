import _ from 'lodash'
import type Debug from 'debug'
import { URL } from 'url'
import { cors } from '@packages/network'
import { urlOriginsMatch, urlSameSiteMatch } from '@packages/network/lib/cors'
import { SerializableAutomationCookie, Cookie, CookieJar, toughCookieToAutomationCookie } from '@packages/server/lib/util/cookies'
import type { RequestCredentialLevel } from '../../types'
import type { ResourceType } from 'cypress/types/net-stubbing'

type SiteContext = 'same-origin' | 'same-site' | 'cross-site'

interface RequestDetails {
  url: string
  isAUTFrame: boolean
  doesTopNeedSimulating: boolean
  resourceType?: ResourceType
  credentialLevel?: RequestCredentialLevel
}

/**
 * Determines whether or not a request should attach cookies from the tough-cookie jar or whether a response should set cookies inside the tough-cookie jar.
 * same-origin requests send cookies by default (unless 'omit' is specified by the fetch API). Otherwise, for same-site/cross-site requests, credentials either need to
 * be 'include' via the fetch API or 'true for XmlHttpRequest. If the AUT Iframe is making the request, this is likely a navigation and we should attach/set cookies in the browser,
 * which is critical for lax cookies
 * @param {string} requestUrl - the url of the request
 * @param {string} AUTUrl - The current url of the app under test
 * @param {resourceType} [resourceType] - the request resourceType
 * @param {RequestCredentialLevel} [credentialLevel] - The credentialLevel of the request. For `fetch` this is `omit|same-origin|include` (defaults to same-origin)
 * and for `XmlHttpRequest` it is `true|false` (defaults to false)
 * @param {isAutFrame} [boolean] - whether or not the request is from the AUT Iframe or not
 * @returns {boolean}
 */
export const shouldAttachAndSetCookies = (requestUrl: string, AUTUrl: string | undefined, resourceType?: ResourceType, credentialLevel?: RequestCredentialLevel, isAutFrame?: boolean): boolean => {
  if (!AUTUrl) return false

  const siteContext = calculateSiteContext(requestUrl, AUTUrl)

  switch (resourceType) {
    case 'fetch':
      // never attach cookies regardless of siteContext if omit is optioned
      if (credentialLevel === 'omit') {
        return false
      }

      // attach cookies here if at least one of the following is true
      // a) The siteContext is 'same-origin' (since 'omit' is handled above)
      // b) The credentialLevel is 'include' regardless of siteContext
      if (siteContext === 'same-origin' || credentialLevel === 'include') {
        return true
      }

      return false
    case 'xhr':
      // attach cookies here if at least one of the following is true
      // a) The siteContext is 'same-origin'
      // b) The credentialLevel (withCredentials) is set to true
      if (siteContext === 'same-origin' || credentialLevel) {
        return true
      }

      return false
    default:
      // if we cannot determine a resource level or it isn't applicable,, we likely should store the cookie as it is a navigation or another event as long as the context is same-origin
      if (siteContext === 'same-origin' || isAutFrame) {
        return true
      }

      return false
  }
}

/**
 * Calculates the site context of two urls.
 * This is needed to figure out if cookies are sent by default, as well as if first/third-party cookies apply to a given request
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#third-party_cookies
 *
 * @param {string} url1 - the first url being compared
 * @param {string} url2 - the second url being compared
 * @returns {SiteContext} - the appropriate site context. This is most similar to the Sec-Fetch-Site Directive when
 * calculating the siteContext barring the none option. @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site#directives
 * to see definitions for same-origin, same-site, and cross-site
 */
export const calculateSiteContext = (url1: string, url2: string): SiteContext => {
  if (urlOriginsMatch(url1, url2)) {
    return 'same-origin'
  }

  if (urlSameSiteMatch(url1, url2)) {
    return 'same-site'
  }

  return 'cross-site'
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
  if (!autUrl || cors.urlSameSiteMatch(autUrl, requestUrl)) {
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
  siteContext: SiteContext
  previousCookies: Cookie[] = []

  constructor ({ cookieJar, currentAUTUrl, request, debug }) {
    this.cookieJar = cookieJar
    this.currentAUTUrl = currentAUTUrl
    this.request = request
    this.debug = debug
    this.sameSiteContext = getSameSiteContext(currentAUTUrl, request.url, request.isAUTFrame)
    this.siteContext = calculateSiteContext(this.request.url, this.currentAUTUrl || '')

    const parsedRequestUrl = new URL(request.url)

    this.defaultDomain = parsedRequestUrl.hostname
  }

  capturePreviousCookies () {
    // this plays a part in adding cross-origin cookies to the browser via
    // automation. if the request doesn't need cross-origin handling, this
    // is a noop
    if (!this.request.doesTopNeedSimulating) return

    this.previousCookies = this.cookieJar.getAllCookies()
  }

  getAddedCookies () {
    // this plays a part in adding cross-origin cookies to the browser via
    // automation. if the request doesn't need cross-origin handling, this
    // is a noop
    if (!this.request.doesTopNeedSimulating) return []

    const afterCookies = this.cookieJar.getAllCookies()

    return afterCookies.reduce<SerializableAutomationCookie[]>((memo, afterCookie) => {
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
    // TODO: in the future we may want to check for https, which might be tricky since localhost is considered a secure context
    if (!toughCookie || (toughCookie.sameSite === 'none' && !toughCookie.secure)) {
      return
    }

    // cross site cookies cannot set lax/strict cookies in the browser for xhr/fetch requests (but ok with navigation/document requests)
    // NOTE: This is allowable in firefox as the default cookie behavior is no_restriction (none). However, this shouldn't
    // impact what is happening in the server-side cookie jar as Set-Cookie is still called and firefox will allow it to be set in the browser
    const isXhrOrFetchRequest = this.request.resourceType === 'fetch' || this.request.resourceType === 'xhr'

    if (isXhrOrFetchRequest && this.siteContext === 'cross-site' && toughCookie.sameSite !== 'none') {
      this.debug(`cannot set cookie with SameSite=${toughCookie.sameSite} when site context is ${this.siteContext}`)

      return
    }

    // don't set the cookie in our own cookie jar if the cookie would otherwise fail being set in the browser if the AUT Url
    // was actually top. This prevents cookies from being applied to our cookie jar when they shouldn't, preventing possible security implications.
    const shouldSetCookieGivenSiteContext = shouldAttachAndSetCookies(this.request.url, this.currentAUTUrl, this.request.resourceType, this.request.credentialLevel, this.request.isAUTFrame)

    if (!shouldSetCookieGivenSiteContext) {
      this.debug(`not setting cookie for ${this.request.url} with simulated top ${ this.currentAUTUrl} for ${ this.request.resourceType}:${this.request.credentialLevel}, cookie: ${toughCookie}`)

      return
    }

    try {
      this.cookieJar.setCookie(toughCookie, this.request.url, this.sameSiteContext)
    } catch (err) {
      this.debug('adding cookie to jar failed: %s', err.message)
    }
  }
}
