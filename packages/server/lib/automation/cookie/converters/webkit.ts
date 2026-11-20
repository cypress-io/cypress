import type playwright from 'playwright-webkit'
import { isHostOnlyCookie, sameSiteExtensionToProtocolMap } from '../util'
import type { CyCookie } from '../util'

function convertSameSiteExtensionToPlaywright (str: CyCookie['sameSite']): 'None' | 'Lax' | 'Strict' | undefined {
  return str ? sameSiteExtensionToProtocolMap[str] : undefined
}

export const convertPlaywrightCookieToCyCookie = ({ name, value, domain, path, secure, httpOnly, sameSite, expires }: playwright.Cookie): CyCookie => {
  const cyCookie: CyCookie = {
    name,
    value,
    domain,
    path,
    secure,
    httpOnly,
    // a domain cookie keeps its leading dot, as in CDP
    hostOnly: !!isHostOnlyCookie({ domain }),
    // Use expirationDate instead of expires
    ...expires !== -1 ? { expirationDate: expires } : {},
  }

  if (sameSite === 'None') {
    cyCookie.sameSite = 'no_restriction'
  } else if (sameSite) {
    cyCookie.sameSite = sameSite.toLowerCase() as CyCookie['sameSite']
  }

  return cyCookie
}

export const convertCyCookieToPlaywrightCookie = (cookie: CyCookie): playwright.Cookie => {
  return {
    name: cookie.name,
    value: cookie.value,
    // a cookie without a Path attribute (from cy.request) gets the default path, which Chrome applies in Network.setCookie
    path: cookie.path ?? '/',
    // without the leading dot, WebKit sets a cookie for 'foo.com' only on 'foo.com', not its subdomains
    domain: !cookie.hostOnly && isHostOnlyCookie(cookie) ? `.${cookie.domain}` : cookie.domain,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    expires: cookie.expirationDate!,
    sameSite: convertSameSiteExtensionToPlaywright(cookie.sameSite)!,
  }
}
