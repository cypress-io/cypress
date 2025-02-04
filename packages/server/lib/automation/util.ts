import type playwright from 'playwright-webkit'
import { domainMatch } from 'tough-cookie'

// @ts-ignore
export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
}

// Cypress uses the webextension-style filtering
// https://developer.chrome.com/extensions/cookies#method-getAll
// @ts-ignore
export type CyCookieFilter = chrome.cookies.GetAllDetails

export const cookieMatches = (cookie: CyCookie | playwright.Cookie, filter: CyCookieFilter) => {
  if (filter.domain && !domainMatch(filter.domain, cookie.domain)) {
    return false
  }

  if (filter.path && filter.path !== cookie.path) {
    return false
  }

  if (filter.name && filter.name !== cookie.name) {
    return false
  }

  return true
}
