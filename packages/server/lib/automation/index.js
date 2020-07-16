const _ = require('lodash')
const { v4: uuidv4 } = require('uuid')
const Promise = require('bluebird')
const Cookies = require('./cookies')
const Screenshot = require('./screenshot')

module.exports = {
  create (cyNamespace, cookieNamespace, screenshotsFolder) {
    const requests = {}

    let middleware = null

    const reset = () => {
      return middleware = {
        onPush: null,
        onBeforeRequest: null,
        onRequest: null,
        onResponse: null,
        onAfterResponse: null,
      }
    }

    // set the middleware
    reset()

    const cookies = Cookies(cyNamespace, cookieNamespace)
    const screenshot = Screenshot(screenshotsFolder)

    const get = (fn) => {
      return middleware[fn]
    }

    const invokeAsync = (fn, ...args) => {
      return Promise
      .try(() => {
        fn = get(fn)

        if (fn) {
          return fn(...args)
        }
      })
    }

    const requestAutomationResponse = (message, data, fn) => {
      return new Promise((resolve, reject) => {
        const id = uuidv4()

        requests[id] = function (obj) {
          // normalize the error from automation responses
          const e = obj.__error

          if (e) {
            const err = new Error(e)

            err.name = obj.__name
            err.stack = obj.__stack

            return reject(err)
          }

          // normalize the response
          return resolve(obj.response)
        }

        // callback onAutomate with the right args
        return fn(message, data, id)
      })
    }

    const automationValve = (message, fn) => {
      return (function (msg, data) {
        // enable us to omit message
        // argument
        let onReq

        if (!data) {
          data = msg
          msg = message
        }

        // if we have an onRequest function
        // then just invoke that
        if ((onReq = get('onRequest'))) {
          return onReq(msg, data)
        }

        // do the default
        return requestAutomationResponse(msg, data, fn)
      })
    }

    const normalize = (message, data, automate) => {
      return Promise.try(() => {
        switch (message) {
          case 'take:screenshot':
            return screenshot.capture(data, automate)
          case 'get:cookies':
            return cookies.getCookies(data, automate)
          case 'get:cookie':
            return cookies.getCookie(data, automate)
          case 'set:cookie':
            return cookies.setCookie(data, automate)
          case 'clear:cookies':
            return cookies.clearCookies(data, automate)
          case 'clear:cookie':
            return cookies.clearCookie(data, automate)
          case 'change:cookie':
            return cookies.changeCookie(data)
          default:
            return automate(data)
        }
      })
    }

    return {
      _requests: requests,

      reset () {
        // TODO: there's gotta be a better
        // way to manage this state. i don't
        // like automation being a singleton
        // that's kept around between browsers
        // opening and closing
        const { onPush } = middleware

        reset()

        middleware.onPush = onPush

        return middleware
      },

      get () {
        return middleware
      },

      use (middlewares = {}) {
        return _.extend(middleware, middlewares)
      },

      push (message, data) {
        return normalize(message, data)
        .then((data) => {
          if (data) {
            return invokeAsync('onPush', message, data)
          }
        })
      },

      request (message, data, fn) {
        // curry in the message + callback function
        // for obtaining the external automation data
        const automate = automationValve(message, fn)

        // enable us to tap into before making the request
        return invokeAsync('onBeforeRequest', message, data)
        .then(() => {
          return normalize(message, data, automate)
        }).tap((resp) => {
          return invokeAsync('onAfterResponse', message, data, resp)
        })
      },

      response (id, resp) {
        const request = requests[id]

        if (request) {
          delete request[id]

          return request(resp)
        }
      },
    }
  },
}
