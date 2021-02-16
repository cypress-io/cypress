import Bluebird from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import extension from '@packages/extension'

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

  const cookie = normalizeCookieProps(props)

  return _.omit(cookie, 'hostOnly')
}

export class Cookies {
  static normalizeCookies = normalizeCookies
  static normalizeCookieProps = normalizeCookieProps

  constructor (private cyNamespace, private cookieNamespace) {}

  isNamespaced (cookie) {
    const name = cookie && cookie.name

    // if the cookie has no name, return false
    if (!name) {
      return false
    }

    return name.startsWith(this.cyNamespace) || (name === this.cookieNamespace)
  }

  getCookies (data, automate) {
    debug('getting:cookies %o', data)

    return automate(data)
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
    if (this.isNamespaced(data)) {
      throw new Error('Sorry, you cannot set a Cypress namespaced cookie.')
    }

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

  clearCookie (data, automate) {
    if (this.isNamespaced(data)) {
      throw new Error('Sorry, you cannot clear a Cypress namespaced cookie.')
    }

    debug('clear:cookie %o', data)

    return automate(data)
    .then((cookie) => {
      cookie = normalizeCookieProps(cookie)

      debug('received clear:cookie %o', cookie)

      return cookie
    })
  }

  clearCookies (data, automate) {
    const cookies = _.reject(normalizeCookies(data), (cookie) => this.isNamespaced(cookie))

    debug('clear:cookies %o', cookies)

    const clear = (cookie) => {
      return automate('clear:cookie', { name: cookie.name, domain: cookie.domain })
      .then(normalizeCookieProps)
    }

    return Bluebird.map(cookies, clear)
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
