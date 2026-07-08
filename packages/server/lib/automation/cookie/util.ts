import type playwright from 'playwright-webkit'
import { domainMatch, pathMatch } from 'tough-cookie'
import { parseDomain } from '@packages/network-tools'

// mirrors chrome.cookies.SameSiteStatus — the WebExtension-style sameSite vocabulary
// the automation layer speaks
export type ExtensionSameSiteStatus = 'unspecified' | 'no_restriction' | 'lax' | 'strict'

// maps the extension vocabulary to the PascalCase the protocols speak (CDP's
// Network.CookieSameSite and playwright's sameSite are the same three values)
export const sameSiteExtensionToProtocolMap = {
  'no_restriction': 'None',
  'lax': 'Lax',
  'strict': 'Strict',
} as const

// @ts-ignore
export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: Exclude<ExtensionSameSiteStatus, 'unspecified'>
}

// Cypress uses the webextension-style filtering
// https://developer.chrome.com/extensions/cookies#method-getAll
// @ts-ignore
export type CyCookieFilter = chrome.cookies.GetAllDetails

// without this logic, a cookie being set on 'foo.com' will only be set for 'foo.com', not other subdomains
export function isHostOnlyCookie (cookie) {
  if (cookie.domain[0] === '.') return false

  const parsedDomain = parseDomain(cookie.domain)

  // make every cookie non-hostOnly
  // unless it's a top-level domain (localhost, ...) or IP address
  return parsedDomain && parsedDomain.tld !== cookie.domain
}

export const cookieMatches = (cookie: CyCookie | playwright.Cookie, filter?: CyCookieFilter, options?: { strictDomain: boolean }) => {
  if (filter?.domain) {
    if (options?.strictDomain ? filter?.domain !== cookie.domain : !domainMatch(filter?.domain, cookie.domain)) {
      return false
    }
  }

  if (filter?.path && !pathMatch(filter.path, cookie.path)) {
    return false
  }

  if (filter?.name && filter?.name !== cookie.name) {
    return false
  }

  return true
}
