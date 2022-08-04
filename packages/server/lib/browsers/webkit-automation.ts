import Bluebird from 'bluebird'
import debugModule from 'debug'
import _ from 'lodash'

import type playwright from 'playwright-webkit'

const dbg = debugModule('cypress:playwright_automation')

// Type definiton for the convertSameSiteExtensionToCdp which is converting the Playwright cookie format into
// the internal cookie format used by Cypress
export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
}

type CookieFilter = {
  name: string
  domain: string
}

function convertSameSiteExtensionToCypress (str: CyCookie['sameSite']): 'None' | 'Lax' | 'Strict' | undefined {
  return str ? ({
    'no_restriction': 'None',
    'lax': 'Lax',
    'strict': 'Strict',
  })[str] : str as any
}

const normalizeGetCookieProps = (cookie: any): CyCookie => {
  if (cookie.expires === -1) {
    delete cookie.expires
  }

  // Use expirationDate instead of expires 🤷‍♀️
  cookie.expirationDate = cookie.expires
  delete cookie.expires

  if (cookie.sameSite === 'None') {
    cookie.sameSite = 'no_restriction'
  }

  return cookie as CyCookie
}

const normalizeSetCookieProps = (cookie: CyCookie): playwright.Cookie => {
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

const _domainIsWithinSuperdomain = (domain: string, suffix: string) => {
  const suffixParts = suffix.split('.').filter(_.identity)
  const domainParts = domain.split('.').filter(_.identity)

  return _.isEqual(suffixParts, domainParts.slice(domainParts.length - suffixParts.length))
}

const _cookieMatches = (cookie: any, filter: Record<string, any>) => {
  if (filter.domain && !(cookie.domain && _domainIsWithinSuperdomain(cookie.domain, filter.domain))) {
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

export class WebkitAutomation {
  private context: playwright.BrowserContext
  public reset: (url: string) => Promise<void>

  constructor(resetPage, private page: playwright.Page) {
    this.context = page.context()
    this.reset = async (url: string) => {
      this.page = await resetPage(url)
      this.context = this.page.context()
    }
  }

  private async getCookies() {
    const cookies = await this.context.cookies()
    return cookies.map(normalizeGetCookieProps)
  }

  private async getCookie(filter: CookieFilter) {
    const cookies = await this.context.cookies()
    if (!cookies.length) return null
    const cookie = cookies.find((cookie) => {
      return _cookieMatches(cookie, {
        domain: filter.domain,
        name: filter.name,
      })
    })
    if (!cookie) return null
    return normalizeGetCookieProps(cookie)
  }

  private async clearCookie(filter: CookieFilter) {
    const allCookies = await this.context.cookies()
    const persistCookies = allCookies.filter((cookie) => {
      return !_cookieMatches(cookie, filter)
    })

    await this.context.clearCookies()
    if (persistCookies.length) await this.context.addCookies(persistCookies)
  }

  onRequest = async (message, data) => {
    switch (message) {
      case 'is:automation:client:connected':
        return true
      case 'get:cookies':
        return await this.getCookies()
      case 'get:cookie':
        return await this.getCookie(data)
      case 'set:cookie':
        return await this.context.addCookies([normalizeSetCookieProps(data)])
      case 'add:cookies':
      case 'set:cookies':
        return await this.context.addCookies(data.map(normalizeSetCookieProps))
      case 'clear:cookies':
        return await this.context.clearCookies()
      case 'clear:cookie':
        return await this.clearCookie(data)
      case 'take:screenshot':
        const buffer = await this.page.screenshot({
          fullPage: data.capture === 'fullPage',
          timeout: 0,
          type: 'png',
        })

        const b64data = buffer.toString('base64')

        return `data:image/png;base64,${b64data}`
      case 'focus:browser:window':
        return await this.context.pages[0]?.bringToFront()
      case 'reset:browser:state':
        return
      case 'reset:browser:tabs:for:next:test':
        if (data.shouldKeepTabOpen) return await this.reset()
        return await this.context.browser()?.close()
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }
}
