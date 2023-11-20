import _ from 'lodash'
import Cookies from 'js-cookie'
import { CookieJar } from '@packages/server/lib/util/cookies'

import $errUtils from './error_utils'

let isDebugging = false
let isDebuggingVerbose = false

export const $Cookies = (namespace, domain) => {
  const isNamespaced = (name) => {
    return _.startsWith(name, namespace)
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

    _set (name, value, options = {}) {
      // don't set anything if we've been told to unload
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

    preserveOnce () {
      return $errUtils.throwErrByPath('cookies.removed', { args: { cmd: 'Cypress.Cookies.preserveOnce' } })
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

    defaults () {
      return $errUtils.throwErrByPath('cookies.removed', { args: { cmd: 'Cypress.Cookies.defaults' } })
    },

    parse (cookieString: string) {
      return CookieJar.parse(cookieString)
    },
  }

  return API
}

$Cookies.create = (namespace, domain): ICookies => {
  // set the $Cookies function onto the Cypress instance
  return $Cookies(namespace, domain)
}

export type ICookies = ReturnType<typeof $Cookies>
