import type playwright from 'playwright-webkit'

export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
}

// Cypress uses the webextension-style filtering
// https://developer.chrome.com/extensions/cookies#method-getAll
export type CyCookieFilter = chrome.cookies.GetAllDetails

const leadingPeriodRegex = /^\./
const removeLeadingPeriod = (domain: string) => {
  return domain.replace(leadingPeriodRegex, '')
}

export const cookieMatches = (cookie: CyCookie | playwright.Cookie, filter: CyCookieFilter) => {
  // domain comparison disregards leading period, e.g. ".example.com" === "example.com"
  if (filter.domain && removeLeadingPeriod(cookie.domain) !== removeLeadingPeriod(filter.domain)) {
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
