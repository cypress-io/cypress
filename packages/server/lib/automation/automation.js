'use strict'
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
const bluebird_1 = __importDefault(require('bluebird'))
const uuid_1 = require('uuid')
const cookies_1 = require('./cookies')
const screenshot_1 = require('./screenshot')

class Automation {
  constructor (cyNamespace, cookieNamespace, screenshotsFolder) {
    this.initializeMiddleware = () => {
      let _a

      return {
        onPush: ((_a = this.middleware) === null || _a === void 0 ? void 0 : _a.onPush) || null,
        onBeforeRequest: null,
        onRequest: null,
        onResponse: null,
        onAfterResponse: null,
      }
    }

    this.response = (id, resp) => {
      const request = this.requests[id]

      if (request) {
        delete request[id]

        return request(resp)
      }
    }

    this.get = (fn) => {
      return this.middleware[fn]
    }

    this.requests = {}
    // set the middleware
    this.middleware = this.initializeMiddleware()
    this.cookies = new cookies_1.Cookies(cyNamespace, cookieNamespace)
    this.screenshot = screenshot_1.screenshot(screenshotsFolder)
  }
  reset () {
    this.middleware = this.initializeMiddleware()
  }
  automationValve (message, fn) {
    return (msg, data) => {
      // enable us to omit message
      // argument
      if (!data) {
        data = msg
        msg = message
      }

      const onReq = this.get('onRequest')

      // if we have an onRequest function
      // then just invoke that
      if (onReq) {
        return onReq(msg, data)
      }

      // do the default
      return this.requestAutomationResponse(msg, data, fn)
    }
  }
  requestAutomationResponse (message, data, fn) {
    return new bluebird_1.default((resolve, reject) => {
      const id = uuid_1.v4()

      this.requests[id] = function (obj) {
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
  invokeAsync (fn, ...args) {
    return bluebird_1.default
    .try(() => {
      fn = this.get(fn)
      if (fn) {
        return fn(...args)
      }
    })
  }
  normalize (message, data, automate) {
    return bluebird_1.default.try(() => {
      switch (message) {
        case 'take:screenshot':
          return this.screenshot.capture(data, automate)
        case 'get:cookies':
          return this.cookies.getCookies(data, automate)
        case 'get:cookie':
          return this.cookies.getCookie(data, automate)
        case 'set:cookie':
          return this.cookies.setCookie(data, automate)
        case 'clear:cookies':
          return this.cookies.clearCookies(data, automate)
        case 'clear:cookie':
          return this.cookies.clearCookie(data, automate)
        case 'change:cookie':
          return this.cookies.changeCookie(data)
        default:
          return automate(data)
      }
    })
  }
  getRequests () {
    return this.requests
  }
  getMiddleware () {
    return this.middleware
  }
  use (middlewares) {
    return this.middleware = Object.assign(Object.assign({}, this.middleware), middlewares)
  }
  push (message, data) {
    return this.normalize(message, data)
    .then((data) => {
      if (data) {
        this.invokeAsync('onPush', message, data)
      }
    })
  }
  request (message, data, fn) {
    // curry in the message + callback function
    // for obtaining the external automation data
    const automate = this.automationValve(message, fn)

    // enable us to tap into before making the request
    return this.invokeAsync('onBeforeRequest', message, data)
    .then(() => {
      return this.normalize(message, data, automate)
    })
    .tap((resp) => {
      return this.invokeAsync('onAfterResponse', message, data, resp)
    })
  }
}
exports.Automation = Automation
