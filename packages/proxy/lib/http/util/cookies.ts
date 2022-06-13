import _ from 'lodash'
import { Cookie, CookieJar } from 'tough-cookie'
import dayjs from 'dayjs'
import debugModule from 'debug'
import { URL } from 'url'
import { cors } from '@packages/network'

const debug = debugModule('cypress:proxy:http:cookies')

interface CookieObject {
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
export const getSameSiteContext = (autUrl, requestUrl, isAUTFrameRequest) => {
  // if the request origin matches the AUT origin, cookies can be handled
  // in a strict fashion
  if (cors.urlOriginsMatch(autUrl, requestUrl)) {
    return 'strict'
  }

  // being an AUT frame request means it's from navigation, so the context is
  // 'lax'. otherwise, 'none' indicates a non-navigation cross-origin request
  return isAUTFrameRequest ? 'lax' : 'none'
}

const sameSiteNoneRe = /; +samesite=(?:'none'|"none"|none)/i

export const parseCookie = (cookie, defaultDomain) => {
  const toughCookie = Cookie.parse(cookie)

  if (!toughCookie) return

  // fixes tough-cookie defaulting undefined/invalid SameSite to 'none'
  // https://github.com/salesforce/tough-cookie/issues/191
  const hasUnspecifiedSameSite = toughCookie.sameSite === 'none' && !sameSiteNoneRe.test(cookie)

  if (hasUnspecifiedSameSite) {
    toughCookie.sameSite = 'lax'
  }

  if (!toughCookie.domain) {
    toughCookie.domain = defaultDomain
  }

  // tough-cookie's cookie jar handles maxAge properly and unsets cookies as
  // needed, but when we set them on automation, it needs the expires set for
  // it to remove the cookie appropriately
  if (toughCookie.maxAge === '-Infinity') {
    toughCookie.expires = dayjs().subtract(1, 'day').toDate()
  } else if (toughCookie.maxAge === 'Infinity') {
    toughCookie.expires = 'Infinity'
  } else if (toughCookie.maxAge != null) {
    toughCookie.expires = dayjs().add(toughCookie.maxAge, 'second').toDate()
  }

  return toughCookie
}

const getAllCookies = (cookieJar): Promise<Cookie[]> => {
  return new Promise((resolve, reject) => {
    cookieJar.store.getAllCookies((err, cookies) => {
      if (err) {
        return reject(err)
      }

      resolve(cookies)
    })
  })
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
    sameSite: toughCookie.sameSite,
    secure: toughCookie.secure,
    value: toughCookie.value,
  }
}

export class CookiesHelper {
  cookieJar: CookieJar
  currentAUTUrl: string
  request: RequestDetails
  defaultDomain: string
  sameSiteContext: 'strict' | 'lax' | 'none'
  previousCookies: Cookie[] = []

  constructor ({ cookieJar, currentAUTUrl, request }) {
    this.cookieJar = cookieJar
    this.currentAUTUrl = currentAUTUrl
    this.request = request
    this.sameSiteContext = getSameSiteContext(currentAUTUrl, request.url, request.isAUTFrame)

    const parsedRequestUrl = new URL(request.url)

    this.defaultDomain = parsedRequestUrl.hostname
  }

  async capturePreviousCookies () {
    // this plays a part in adding cross-origin cookies to the browser via
    // automation. if the request doesn't need cross-origin handling, this
    // is a nooop
    if (!this.request.needsCrossOriginHandling) return

    this.previousCookies = await getAllCookies(this.cookieJar)
  }

  async getAddedCookies () {
    // this plays a part in adding cross-origin cookies to the browser via
    // automation. if the request doesn't need cross-origin handling, this
    // is a nooop
    if (!this.request.needsCrossOriginHandling) return []

    const afterCookies = await getAllCookies(this.cookieJar)

    return afterCookies.reduce<CookieObject[]>((memo, afterCookie) => {
      if (matchesPreviousCookie(this.previousCookies, afterCookie)) return memo

      return memo.concat(toughCookieToAutomationCookie(afterCookie, this.defaultDomain))
    }, [])
  }

  setCookie (cookie) {
    try {
      this.cookieJar.setCookieSync(cookie, this.request.url, {
        // @ts-ignore
        sameSiteContext: this.sameSiteContext,
      })
    } catch (err) {
      debug('setting cookie on jar failed: %s', err.message)
    }
  }

  parseCookie (cookie) {
    return parseCookie(cookie, this.defaultDomain)
  }
}
