import { Cookie, CookieJar as ToughCookieJar } from 'tough-cookie'
import type { AutomationCookie } from '../automation/cookies'

interface SerializableAutomationCookie extends Omit<AutomationCookie, 'expiry'> {
  expiry: 'Infinity' | '-Infinity' | number | null
  maxAge: 'Infinity' | '-Infinity' | number | null
}

export { SerializableAutomationCookie, Cookie }

interface CookieData {
  name: string
  domain: string
  path?: string
}

export type SameSiteContext = 'strict' | 'lax' | 'none' | undefined

export const toughCookieToAutomationCookie = (toughCookie: Cookie, defaultDomain: string): SerializableAutomationCookie => {
  // tough-cookie is smart enough to determine the expiryTime based on maxAge and expiry
  // meaning the expiry property should be a catch all for determining expiry time
  const expiry = toughCookie.expiryTime()

  return {
    domain: toughCookie.domain || defaultDomain,
    // cast Infinity/-Infinity to a string to make sure the data is serialized through the automation client.
    // cookie normalization in the automation client will cast this back to Infinity/-Infinity
    expiry: (expiry === Infinity || expiry === -Infinity) ? expiry.toString() as '-Infinity' | 'Infinity' : expiry / 1000,
    httpOnly: toughCookie.httpOnly,
    // we want to make sure the hostOnly property is respected when syncing with CDP/extension to prevent duplicates
    hostOnly: toughCookie.hostOnly || false,
    maxAge: toughCookie.maxAge,
    name: toughCookie.key,
    path: toughCookie.path,
    sameSite: toughCookie.sameSite === 'none' ? 'no_restriction' : toughCookie.sameSite,
    secure: toughCookie.secure,
    value: toughCookie.value,
  }
}

export const automationCookieToToughCookie = (automationCookie: SerializableAutomationCookie, defaultDomain: string): Cookie => {
  let expiry: Date | undefined = undefined

  if (automationCookie.expiry != null) {
    if (isFinite(automationCookie.expiry as number)) {
      expiry = new Date(automationCookie.expiry as number * 1000)
    } else if (automationCookie.expiry === '-Infinity' || automationCookie.expiry === -Infinity) {
      // if negative Infinity, the cookie is Date(0), has expired and is slated to be removed
      expiry = new Date(0)
    }
    // if Infinity is set on the automation client, the expiry doesn't get set, meaning the no-op
    // accomplishes an Infinite expire time
  }

  return new Cookie({
    domain: automationCookie.domain || defaultDomain,
    expires: expiry,
    httpOnly: automationCookie.httpOnly,
    // we want to make sure the hostOnly property is respected when syncing with CDP/extension to prevent duplicates
    hostOnly: automationCookie.hostOnly || false,
    maxAge: automationCookie.maxAge || 'Infinity',
    key: automationCookie.name,
    path: automationCookie.path || undefined,
    sameSite: automationCookie.sameSite === 'no_restriction' ? 'none' : automationCookie.sameSite,
    secure: automationCookie.secure,
    value: automationCookie.value,
  })
}

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

    // not all browsers currently default to lax, but they're heading in that
    // direction since it's now the standard, so this is more future-proof
    if (toughCookie.sameSite === undefined) {
      toughCookie.sameSite = 'lax'
    }

    return toughCookie
  }

  constructor () {
    this._cookieJar = new ToughCookieJar(undefined, { allowSpecialUseDomain: true })
  }

  getCookies (url: string, sameSiteContext: SameSiteContext = undefined) {
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

  setCookie (cookie: string | Cookie, url: string, sameSiteContext: SameSiteContext) {
    // @ts-ignore
    return this._cookieJar.setCookieSync(cookie, url, { sameSiteContext })
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
