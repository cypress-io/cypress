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

// sameSiteContext is a concept for tough-cookie's cookie jar that helps it
// simulate what a browser would do when determining whether or not it should
// be set from a response or a attached to a response. it shouldn't be confused
// with a cookie's SameSite property, though that also plays a role when
// setting/getting a cookie from the tough-cookie cookie jar. see tough-cookie's
// own explanation of sameSiteContext for more information:
// see https://github.com/salesforce/tough-cookie#samesite-cookies
export const getSameSiteContext = (autUrl: string | undefined, requestUrl: string, isAUTFrameRequest: boolean) => {
  // if there's no AUT URL, it's a request for the first URL visited, or if
  // the request origin matches the AUT origin; both indicate that it's not
  // a cross-origin request
  if (!autUrl || cors.urlOriginsMatch(autUrl, requestUrl)) {
    return 'strict'
  }

  // being an AUT frame request means it's via top-level navigation, and we've
  // ruled out same-origin navigation, so the context is 'lax'.
  // anything else is a non-navigation, cross-origin request
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
