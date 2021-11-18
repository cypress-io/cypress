import _ from 'lodash'
import Debug from 'debug'
import extension from '@packages/extension'
import { isHostOnlyCookie } from '../browsers/cdp_automation'

// match the w3c webdriver spec on return cookies
// https://w3c.github.io/webdriver/webdriver-spec.html#cookies
const COOKIE_PROPERTIES = 'name value path domain secure httpOnly expiry hostOnly sameSite'.split(' ')

const debug = Debug('cypress:server:automation:cookies')

const normalizeCookies = (cookies) => {
  return _.map(cookies, normalizeCookieProps)
}

const normalizeCookieProps = function (props) {
  if (!props) {
    return props
  }

  const cookie = _.pick(props, COOKIE_PROPERTIES)

  if (props.expiry != null) {
    // when sending cookie props we need to convert
    // expiry to expirationDate
    delete cookie.expiry
    cookie.expirationDate = props.expiry
  } else if (props.expirationDate != null) {
    // and when receiving cookie props we need to convert
    // expirationDate to expiry and always remove url
    delete cookie.expirationDate
    delete cookie.url
    cookie.expiry = props.expirationDate
  }

  return cookie
}

export const normalizeGetCookies = (cookies) => {
  return _.chain(cookies)
  .map(normalizeGetCookieProps)
  // sort in order of expiration date, ascending
  .sortBy(_.partialRight(_.get, 'expiry', Number.MAX_SAFE_INTEGER))
  .value()
}

export const normalizeGetCookieProps = (props) => {
  if (!props) {
    return props
  }

  if (props.hostOnly === false || (props.hostOnly && !isHostOnlyCookie(props))) {
    delete props.hostOnly
  }

  return normalizeCookieProps(props)
}

export class Cookies {
  static normalizeCookies = normalizeCookies
  static normalizeCookieProps = normalizeCookieProps

  constructor (private cyNamespace, private cookieNamespace) {}

  isNamespaced = (cookie) => {
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

  getCookies (data, automate) {
    debug('getting:cookies %o', data)

    return automate('get:cookies', data)
    .then((cookies) => {
      cookies = normalizeGetCookies(cookies)
      cookies = _.reject(cookies, (cookie) => this.isNamespaced(cookie))

      debug('received get:cookies %o', cookies)

      return cookies
    })
  }

  getCookie (data, automate) {
    debug('getting:cookie %o', data)

    return automate(data)
    .then((cookie) => {
      if (this.isNamespaced(cookie)) {
        throw new Error('Sorry, you cannot get a Cypress namespaced cookie.')
      } else {
        cookie = normalizeGetCookieProps(cookie)

        debug('received get:cookie %o', cookie)

        return cookie
      }
    })
  }

  setCookie (data, automate) {
    this.throwIfNamespaced(data)
    const cookie = normalizeCookieProps(data)

    // lets construct the url ourselves right now
    // unless we already have a URL
    cookie.url = data.url != null ? data.url : extension.getCookieUrl(data)

    debug('set:cookie %o', cookie)

    return automate(cookie)
    .then((cookie) => {
      cookie = normalizeGetCookieProps(cookie)

      debug('received set:cookie %o', cookie)

      return cookie
    })
  }

  setCookies (cookies, automate) {
    cookies = cookies.map((data) => {
      this.throwIfNamespaced(data)
      const cookie = normalizeCookieProps(data)

      // lets construct the url ourselves right now
      // unless we already have a URL
      cookie.url = data.url != null ? data.url : extension.getCookieUrl(data)

      return cookie
    })

    debug('set:cookies %o', cookies)

    return automate('set:cookies', cookies)
    // .tap(console.log)
    .return(cookies)
  }

  clearCookie (data, automate) {
    this.throwIfNamespaced(data)
    debug('clear:cookie %o', data)

    return automate(data)
    .then((cookie) => {
      cookie = normalizeCookieProps(cookie)

      debug('received clear:cookie %o', cookie)

      return cookie
    })
  }

  async clearCookies (data, automate) {
    const cookiesToClear = data

    const cookies = _.reject(normalizeCookies(cookiesToClear), this.isNamespaced)

    debug('clear:cookies %o', cookies.length)

    return automate('clear:cookies', cookies)
    .mapSeries(normalizeCookieProps)
  }

  changeCookie (data) {
    const c = normalizeCookieProps(data.cookie)

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
