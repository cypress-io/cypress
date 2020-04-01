const _ = require('lodash')
const Cookies = require('js-cookie')

const $errUtils = require('./error_utils')

let isDebugging = false
let isDebuggingVerbose = false

const preserved = {}

const defaults = {
  whitelist: null,
}

const $Cookies = function (namespace, domain) {
  const isNamespaced = (name) => _.startsWith(name, namespace)

  const isWhitelisted = function (cookie) {
    let w

    w = defaults.whitelist

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

  const removePreserved = function (name) {
    if (preserved[name]) {
      return delete preserved[name]
    }
  }

  const API = {
    debug (bool = true, options = {}) {
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

      // eslint-disable-next-line
      return console[m].apply(console, args)
    },

    getClearableCookies (cookies = []) {
      return _.filter(cookies, (cookie) => !isWhitelisted(cookie) && !removePreserved(cookie.name))
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
      return _.each(keys, (key) => preserved[key] = true)
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
      // merge obj into defaults
      return _.extend(defaults, obj)
    },

  }

  _.each(['get', 'set', 'remove', 'getAllCookies', 'clearCookies'], (method) => {
    return API[method] = () => {
      return $errUtils.throwErrByPath('cookies.removed_method', {
        args: { method },
      })
    }
  })

  return API
}

// set the $Cookies function onto the Cypress instance
$Cookies.create = (namespace, domain) => {
  return $Cookies(namespace, domain)
}

module.exports = $Cookies
