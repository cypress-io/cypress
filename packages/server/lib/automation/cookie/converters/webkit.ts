import type playwright from 'playwright-webkit'
import type { CyCookie } from '../util'

const extensionMap = {
  'no_restriction': 'None',
  'lax': 'Lax',
  'strict': 'Strict',
} as const

function convertSameSiteExtensionToPlaywright (str: CyCookie['sameSite']): 'None' | 'Lax' | 'Strict' | undefined {
  return str ? extensionMap[str] : undefined
}

export const convertPlaywrightCookieToCyCookie = ({ name, value, domain, path, secure, httpOnly, sameSite, expires }: playwright.Cookie): CyCookie => {
  const cyCookie: CyCookie = {
    name,
    value,
    domain,
    path,
    secure,
    httpOnly,
    hostOnly: false,
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
    path: cookie.path,
    domain: cookie.domain,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    expires: cookie.expirationDate!,
    sameSite: convertSameSiteExtensionToPlaywright(cookie.sameSite)!,
  }
}
