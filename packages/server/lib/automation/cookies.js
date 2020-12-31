const _ = require('lodash')
const extension = require('@packages/extension')
const debug = require('debug')('cypress:server:automation:cookies')
const { isHostOnlyCookie } = require('../browsers/cdp_automation')
// match the w3c webdriver spec on return cookies
// https://w3c.github.io/webdriver/webdriver-spec.html#cookies
const COOKIE_PROPERTIES = 'name value path domain secure httpOnly expiry hostOnly sameSite'.split(' ')

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

const normalizeGetCookies = (cookies) => {
  return _.chain(cookies)
  .map(normalizeGetCookieProps)
  // sort in order of expiration date, ascending
  .sortBy(_.partialRight(_.get, 'expiry', Number.MAX_SAFE_INTEGER))
  .value()
}

const normalizeGetCookieProps = function (props) {
  if (!props) {
    return props
  }

  if (props.hostOnly === false || (props.hostOnly && !isHostOnlyCookie(props))) {
    delete props.hostOnly
  }

  return normalizeCookieProps(props)
}

let cookies = function (cyNamespace, cookieNamespace) {
  const isNamespaced = function (cookie) {
    const name = cookie && cookie.name

    // if the cookie has no name, return false
    if (!name) {
      return false
    }

    return name.startsWith(cyNamespace) || (name === cookieNamespace)
  }

  const throwIfNamespaced = (data) => {
    if (isNamespaced(data)) {
      throw new Error('Sorry, you cannot modify a Cypress namespaced cookie.')
    }
  }

  return {
    getCookies (data, automate) {
      debug('getting:cookies %o', data)

      return automate('get:cookies', data)
      .then((cookies) => {
        cookies = normalizeGetCookies(cookies)
        cookies = _.reject(cookies, isNamespaced)

        debug('received get:cookies %o', cookies)

        return cookies
      })
    },

    getCookie (data, automate) {
      debug('getting:cookie %o', data)

      return automate(data)
      .then((cookie) => {
        if (isNamespaced(cookie)) {
          throw new Error('Sorry, you cannot get a Cypress namespaced cookie.')
        } else {
          cookie = normalizeGetCookieProps(cookie)

          debug('received get:cookie %o', cookie)

          return cookie
        }
      })
    },

    setCookie (data, automate) {
      throwIfNamespaced(data)
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
    },

    setCookies (cookies, automate) {
      cookies = cookies.map((data) => {
        throwIfNamespaced(data)
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
    },

    clearCookie (data, automate) {
      throwIfNamespaced(data)
      debug('clear:cookie %o', data)

      return automate(data)
      .then((cookie) => {
        cookie = normalizeCookieProps(cookie)

        debug('received clear:cookie %o', cookie)

        return cookie
      })
    },

    async clearCookies (data, automate) {
      const cookiesToClear = data || await this.getCookies({}, automate)

      cookies = _.reject(normalizeCookies(cookiesToClear), isNamespaced)

      debug('clear:cookies %o', cookies.length)

      return automate('clear:cookies', cookies)
      .mapSeries(normalizeCookieProps)
    },

    changeCookie (data) {
      const c = normalizeCookieProps(data.cookie)

      if (isNamespaced(c)) {
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
    },

  }
}

cookies.normalizeCookies = normalizeCookies
cookies.normalizeCookieProps = normalizeCookieProps

module.exports = cookies
