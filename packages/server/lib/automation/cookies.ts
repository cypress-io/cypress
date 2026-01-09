import _ from 'lodash'
import Debug from 'debug'
import { isHostOnlyCookie } from '../browsers/cdp_automation'
import type { SerializableAutomationCookie } from '../util/cookies'

type AutomationFn<V, T> = (data: V) => Promise<T>

type AutomationMessageFn<V, T> = (message: string, data: V) => Promise<T>

export interface AutomationCookie {
  domain: string
  expirationDate?: number
  expiry: number | null
  httpOnly: boolean
  hostOnly?: boolean
  name: string
  path: string | null
  sameSite: string
  secure: boolean
  url?: string
  value: string
}

// match the w3c webdriver spec on return cookies
// https://w3c.github.io/webdriver/webdriver-spec.html#cookies
const COOKIE_PROPERTIES = 'domain expiry httpOnly hostOnly name path sameSite secure value'.split(' ')

const debug = Debug('cypress:server:automation:cookies')

const normalizeCookies = (cookies: (SerializableAutomationCookie | AutomationCookie)[]): AutomationCookie[] => {
  return _.map(cookies, normalizeCookieProps) as AutomationCookie[]
}

const getCookieUrl = (cookie: {
  secure?: boolean | null
  domain?: string | null
  path?: string | null
} = {}) => {
  const prefix = cookie.secure ? 'https://' : 'http://'

  // https://github.com/cypress-io/cypress/issues/6375
  const host = cookie.domain?.startsWith('.') ? cookie.domain.slice(1) : cookie.domain

  return prefix + host + (cookie.path || '')
}

const normalizeCookieProps = function (automationCookie: SerializableAutomationCookie | AutomationCookie | null) {
  if (!automationCookie) {
    return automationCookie
  }

  const cookie = _.pick(automationCookie, COOKIE_PROPERTIES)

  if (automationCookie.expiry === '-Infinity') {
    cookie.expiry = -Infinity
    // set the cookie to expired so when set, the cookie is removed
    cookie.expirationDate = 0
  } else if (automationCookie.expiry === 'Infinity') {
    cookie.expiry = null
  } else if (automationCookie.expiry != null) {
    // when sending cookie props we need to convert
    // expiry to expirationDate
    delete cookie.expiry
    cookie.expirationDate = automationCookie.expiry
  } else if (automationCookie.expirationDate != null) {
    // and when receiving cookie props we need to convert
    // expirationDate to expiry and always remove url
    delete cookie.expirationDate
    delete cookie.url
    cookie.expiry = automationCookie.expirationDate
  }

  return cookie as AutomationCookie
}

const normalizeGetCookies = (cookies: (AutomationCookie | null)[]): (AutomationCookie | null)[] => {
  return _.chain(cookies)
  .map(normalizeGetCookieProps)
  // sort in order of expiration date, ascending
  .sortBy(_.partialRight(_.get, 'expiry', Number.MAX_SAFE_INTEGER))
  .value()
}

const normalizeGetCookieProps = (props: AutomationCookie | null) => {
  if (!props) {
    return props
  }

  if (props.hostOnly === false || (props.hostOnly && !isHostOnlyCookie(props))) {
    delete props.hostOnly
  }

  return normalizeCookieProps(props)
}

/**
 * Utility for getting/setting/clearing cookies via automation
 * Normalizes the API for different automation mechanisms (CDP, extension, etc)
 */
export class Cookies {
  static normalizeCookies = normalizeCookies
  static normalizeCookieProps = normalizeCookieProps

  constructor (private cyNamespace, private cookieNamespace) {}

  isNamespaced = (cookie: AutomationCookie | null) => {
    const name = cookie && cookie.name

    // if the cookie has no name, return false
    if (!name) {
      return false
    }

    return name.startsWith(this.cyNamespace) || (name === this.cookieNamespace)
  }

  throwIfNamespaced = (data) => {
    if (this.isNamespaced(data)) {
      throw new Error('Sorry, you cannot modify a Cypress namespaced cookie.')
    }
  }

  async getCookies (data: {
    domain?: string
  }, automate: AutomationMessageFn<any, (AutomationCookie | null)[]>) {
    debug('getting:cookies %o', data)

    let cookies = await automate('get:cookies', data)

    cookies = normalizeGetCookies(cookies)
    cookies = _.reject(cookies, (cookie) => this.isNamespaced(cookie)) as AutomationCookie[]

    debug('received get:cookies %o', cookies)

    return cookies
  }

  async getCookie (data: {
    domain: string
    name: string
  }, automate: AutomationFn<{
    domain: string
    name: string
  }, AutomationCookie | null>) {
    debug('getting:cookie %o', data)

    let cookie = await automate(data)

      if (this.isNamespaced(cookie)) {
        throw new Error('Sorry, you cannot get a Cypress namespaced cookie.')
      } else {
        cookie = normalizeGetCookieProps(cookie)

        debug('received get:cookie %o', cookie)

        return cookie
      }
  }

  async setCookie (data: SerializableAutomationCookie, automate: AutomationFn<AutomationCookie, AutomationCookie | null>) {
    this.throwIfNamespaced(data)
    const cookie = normalizeCookieProps(data) as AutomationCookie

    // lets construct the url ourselves right now
    // unless we already have a URL
    cookie.url = data.url != null ? data.url : getCookieUrl(data)

    debug('set:cookie %o', cookie)

    let automationCookie = await automate(cookie)

    automationCookie = normalizeGetCookieProps(automationCookie)

      debug('received set:cookie %o', automationCookie)

      return automationCookie
  }

  async setCookies (
    cookies: SerializableAutomationCookie[] | AutomationCookie[],
    automate: AutomationMessageFn<AutomationCookie[], AutomationCookie[]>,
    eventName: 'set:cookies' | 'add:cookies' = 'set:cookies',
  ) {
    cookies = cookies.map((data) => {
      this.throwIfNamespaced(data)
      const cookie = normalizeCookieProps(data) as AutomationCookie

      // lets construct the url ourselves right now
      // unless we already have a URL
      cookie.url = data.url != null ? data.url : getCookieUrl(data)

      return cookie
    })

    debug(`${eventName} %o`, cookies)

    await automate(eventName, cookies as AutomationCookie[])

    return cookies
  }

  // set:cookies will clear cookies first in browsers that use CDP. this is the
  // same as set:cookies in Firefox, but will only add cookies and not clear
  // them in Chrome, etc.
  addCookies (
    cookies: SerializableAutomationCookie[],
    automate: AutomationMessageFn<AutomationCookie[], AutomationCookie[]>,
  ) {
    return this.setCookies(cookies, automate, 'add:cookies')
  }

  async clearCookie (data: {
    domain: string
    name: string
  }, automate: AutomationFn<{
    domain: string
    name: string
  }, AutomationCookie | null>) {
    this.throwIfNamespaced(data)
    debug('clear:cookie %o', data)

    const cookie = await automate(data)

    const normalizedCookie = normalizeCookieProps(cookie)

    debug('received clear:cookie %o', normalizedCookie)

    return normalizedCookie
  }

  async clearCookies (data: AutomationCookie[], automate: AutomationMessageFn<AutomationCookie[], AutomationCookie[]>) {
    const cookiesToClear = data

    const cookies = _.reject(normalizeCookies(cookiesToClear), this.isNamespaced)

    debug('clear:cookies %o', cookies.length)

    const automationCookies = await automate('clear:cookies', cookies)
    const normalizedCookies = _.map(automationCookies, normalizeCookieProps)

    return normalizedCookies
  }

  changeCookie (data: {
    cause: string
    cookie: SerializableAutomationCookie
    removed: boolean
  }) {
    const c = normalizeCookieProps(data.cookie) as AutomationCookie

    if (this.isNamespaced(c)) {
      return
    }

    const msg = data.removed ?
      `Cookie Removed: '${c.name}'`
      :
      `Cookie Set: '${c.name}'`

    return {
      cookie: c,
      message: msg,
      removed: data.removed,
    }
  }
}
