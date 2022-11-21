import type playwright from 'playwright-webkit'

export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
}

const leadingPeriodRegex = /^\./
const removeLeadingPeriod = (domain: string) => {
  return domain.replace(leadingPeriodRegex, '')
}

export function domainIncludesDomainsCookies (domain1: string, domain2: string) {
  // domain comparison disregards leading period, e.g. ".example.com" === "example.com"
  domain1 = removeLeadingPeriod(domain1)
  domain2 = removeLeadingPeriod(domain2)

  const domain1Parts = domain1.split('.')
  const domain2Parts = domain2.split('.')
  const comparableDomain1Parts = domain1Parts.slice(domain1Parts.length - domain2Parts.length)

  return domain2Parts.join() === comparableDomain1Parts.join()
}

// Cypress uses the webextension-style filtering
// https://developer.chrome.com/extensions/cookies#method-getAll
export type CyCookieFilter = chrome.cookies.GetAllDetails

export const cookieMatches = (cookie: CyCookie | playwright.Cookie, filter: CyCookieFilter) => {
  if (filter.domain && !domainIncludesDomainsCookies(filter.domain, cookie.domain)) {
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
