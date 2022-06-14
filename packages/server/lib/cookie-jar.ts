import { Cookie, CookieJar as ToughCookieJar } from 'tough-cookie'

interface CookieData {
  name: string
  domain: string
  path?: string
}

export class CookieJar {
  _cookieJar: ToughCookieJar

  constructor () {
    this._cookieJar = new ToughCookieJar(undefined, { allowSpecialUseDomain: true })
  }

  getAllCookies () {
    let cookies: Cookie[] = []

    // have to use the internal memstore. looks like an async api, but
    // it's actually synchronous
    // @ts-ignore
    cookieJar.store.getAllCookies((_err, _cookies: Cookie[]) => {
      cookies = _cookies
    })

    return cookies
  }

  setCookie (cookie: string, url: string, sameSiteContext: 'strict' | 'lax' | 'none') {
    // @ts-ignore
    this._cookieJar.setCookieSync(cookie, url, { sameSiteContext })
  }

  removeCookie (cookieData: CookieData) {
    // have to use the internal memstore. looks like an async api, but
    // it's actually synchronous
    // @ts-ignore
    cookieJar.store.removeCookie(
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
