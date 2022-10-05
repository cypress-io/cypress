import _ from 'lodash'
import Cookies from 'js-cookie'
import { CookieJar, toughCookieToAutomationCookie } from '@packages/server/lib/util/cookies'

import $errUtils from './error_utils'

let isDebugging = false
let isDebuggingVerbose = false

const preserved = {}

const defaults: any = {
  preserve: null,
}

const warnOnWhitelistRenamed = (obj, type) => {
  if (obj.whitelist) {
    $errUtils.throwErrByPath('cookies.whitelist_renamed', { args: { type } })
  }
}

export const $Cookies = (namespace, domain) => {
  const isNamespaced = (name) => {
    return _.startsWith(name, namespace)
  }

  const isAllowed = (cookie) => {
    const w = defaults.preserve

    if (w) {
      if (_.isString(w)) {
        return cookie.name === w
      }

      if (_.isArray(w)) {
        return w.includes(cookie.name)
      }

      if (_.isFunction(w)) {
        return w(cookie)
      }

      if (_.isRegExp(w)) {
        return w.test(cookie.name)
      }

      return false
    }
  }

  const removePreserved = (name) => {
    if (preserved[name]) {
      return delete preserved[name]
    }

    return false
  }

  const API = {
    debug (bool = true, options: any = {}) {
      _.defaults(options, {
        verbose: true,
      })

      isDebugging = bool
      isDebuggingVerbose = bool && options.verbose
    },

    log (message, cookie, removed) {
      if (!isDebugging) {
        return
      }

      const m = removed ? 'warn' : 'info'

      const args = [_.truncate(message, { length: 50 })]

      if (isDebuggingVerbose) {
        args.push(cookie)
      }

      // eslint-disable-next-line no-console
      return console[m].apply(console, args)
    },

    getClearableCookies (cookies: any[] = []) {
      return _.filter(cookies, (cookie) => {
        return !isAllowed(cookie) && !removePreserved(cookie.name)
      })
    },

    _set (name, value, options = {}) {
      // dont set anything if we've been
      // told to unload
      if (this.getCy('unload') === 'true') {
        return
      }

      _.defaults(options, {
        path: '/',
      })

      return Cookies.set(name, value, options)
    },

    _get (name) {
      return Cookies.get(name)
    },

    setCy (name, value, options = {}) {
      _.defaults(options, {
        domain,
      })

      return this._set(`${namespace}.${name}`, value, options)
    },

    getCy (name) {
      return this._get(`${namespace}.${name}`)
    },

    preserveOnce (...keys) {
      $errUtils.warnByPath('cookies.deprecated', { args: { cmd: 'Cypress.Cookies.preserveOnce' } })

      return _.each(keys, (key) => {
        return preserved[key] = true
      })
    },

    clearCypressCookies () {
      return _.each(Cookies.get(), (value, key) => {
        if (isNamespaced(key)) {
          return Cookies.remove(key, {
            path: '/',
            domain,
          })
        }
      })
    },

    setInitial () {
      return this.setCy('initial', true)
    },

    defaults (obj = {}) {
      $errUtils.warnByPath('cookies.deprecated', { args: { cmd: 'Cypress.Cookies.defaults' } })
      warnOnWhitelistRenamed(obj, 'Cypress.Cookies.defaults')

      // merge obj into defaults
      return _.extend(defaults, obj)
    },

    parse (cookieString: string) {
      return CookieJar.parse(cookieString)
    },

    toughCookieToAutomationCookie,
  }

  return API
}

$Cookies.create = (namespace, domain): ICookies => {
  // set the $Cookies function onto the Cypress instance
  return $Cookies(namespace, domain)
}

export type ICookies = ReturnType<typeof $Cookies>
