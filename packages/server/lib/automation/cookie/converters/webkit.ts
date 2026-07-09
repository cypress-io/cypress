import type playwright from 'playwright-webkit'
import type { CyCookie } from '../util'

const extensionMap = {
  'no_restriction': 'None',
  'lax': 'Lax',
  'strict': 'Strict',
} as const

function convertSameSiteExtensionToCypress (str: CyCookie['sameSite']): 'None' | 'Lax' | 'Strict' | undefined {
  return str ? extensionMap[str] : undefined
}

export const normalizeGetCookieProps = ({ name, value, domain, path, secure, httpOnly, sameSite, expires }: playwright.Cookie): CyCookie => {
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

export const normalizeSetCookieProps = (cookie: CyCookie): playwright.Cookie => {
  return {
    name: cookie.name,
    value: cookie.value,
    path: cookie.path,
    domain: cookie.domain,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    expires: cookie.expirationDate!,
    sameSite: convertSameSiteExtensionToCypress(cookie.sameSite)!,
  }
}
