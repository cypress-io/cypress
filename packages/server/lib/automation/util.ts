import type playwright from 'playwright-webkit'
import type { Protocol } from 'devtools-protocol'
import { domainMatch, pathMatch } from 'tough-cookie'

// @ts-ignore
export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
  // the partition a partitioned cookie (CHIPS) belongs to. needed to correctly
  // restore and clear partitioned cookies (e.g. cross-site SSO cookies) via CDP.
  // @see https://github.com/cypress-io/cypress/issues/33302
  partitionKey?: Protocol.Network.CookiePartitionKey
}

// Cypress uses the webextension-style filtering
// https://developer.chrome.com/extensions/cookies#method-getAll
// @ts-ignore
export type CyCookieFilter = chrome.cookies.GetAllDetails

export const cookieMatches = (cookie: CyCookie | playwright.Cookie, filter?: CyCookieFilter, options?: { strictDomain: boolean }) => {
  if (filter?.domain) {
    if (options?.strictDomain ? filter?.domain !== cookie.domain : !domainMatch(filter?.domain, cookie.domain))
    return false
  }

  if (filter?.path && !pathMatch(filter.path, cookie.path)) {
    return false
  }

  if (filter?.name && filter?.name !== cookie.name) {
    return false
  }

  return true
}
