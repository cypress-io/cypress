import { CookieJar } from 'tough-cookie'

const cookieJar = new CookieJar(undefined, { allowSpecialUseDomain: true })

export function getCookieJar () {
  return cookieJar
}

export function resetCookieJar () {
  cookieJar.removeAllCookiesSync()
}

export function removeCookie (cookieData): Promise<void> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    cookieJar.store.removeCookie(
      cookieData.domain,
      cookieData.path || '/',
      cookieData.name,
      resolve,
    )
  })
}

export function removeAllCookies () {
  return resetCookieJar()
}
