import { Cookie, CookieJar as ToughCookieJar } from 'tough-cookie'
import type { AutomationCookie } from '../automation/cookies'

export { AutomationCookie, Cookie }

interface CookieData {
  name: string
  domain: string
  path?: string
}

export const toughCookieToAutomationCookie = (toughCookie: Cookie, defaultDomain: string): AutomationCookie => {
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

const sameSiteNoneRe = /; +samesite=(?:'none'|"none"|none)/i

/**
 * An adapter for tough-cookie's CookieJar
 * Holds onto cookies captured via the proxy, so they can be applied to
 * requests as needed for the sake of cross-origin testing
 */
export class CookieJar {
  _cookieJar: ToughCookieJar

  static parse (cookie: string) {
    const toughCookie = Cookie.parse(cookie)

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

  constructor () {
    this._cookieJar = new ToughCookieJar(undefined, { allowSpecialUseDomain: true })
  }

  getCookies (url, sameSiteContext) {
    // @ts-ignore
    return this._cookieJar.getCookiesSync(url, { sameSiteContext })
  }

  getAllCookies () {
    let cookies: Cookie[] = []

    // have to use the internal memstore. looks like an async api, but
    // it's actually synchronous
    // @ts-ignore
    this._cookieJar.store.getAllCookies((_err, _cookies: Cookie[]) => {
      cookies = _cookies
    })

    return cookies
  }

  setCookie (cookie: string | Cookie, url: string, sameSiteContext: 'strict' | 'lax' | 'none') {
    // @ts-ignore
    this._cookieJar.setCookieSync(cookie, url, { sameSiteContext })
  }

  removeCookie (cookieData: CookieData) {
    // have to use the internal memstore. looks like an async api, but
    // it's actually synchronous
    // @ts-ignore
    this._cookieJar.store.removeCookie(
      cookieData.domain,
      cookieData.path || '/',
      cookieData.name,
      () => {},
    )
  }

  removeAllCookies () {
    this._cookieJar.removeAllCookiesSync()
  }
}

export const cookieJar = new CookieJar()
