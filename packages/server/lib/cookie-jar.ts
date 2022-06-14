import { CookieJar } from 'tough-cookie'

const cookieJar = new CookieJar(undefined, { allowSpecialUseDomain: true })

export function getCookieJar () {
  return cookieJar
}

export function resetCookieJar () {
  cookieJar.removeAllCookiesSync()
}
