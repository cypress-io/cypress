import { Cookie, CookieJar as ToughCookieJar } from 'tough-cookie'

export { Cookie }

interface CookieData {
  name: string
  domain: string
  path?: string
}

/**
 * An adapter for tough-cookie's CookieJar
 * Holds onto cookies captured via the proxy, so they can be applied to
 * requests as needed for the sake of cross-origin testing
 */
export class CookieJar {
  _cookieJar: ToughCookieJar

  static parse (cookie) {
    return Cookie.parse(cookie)
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
