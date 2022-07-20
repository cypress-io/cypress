import Bluebird from 'bluebird'
import { v4 as uuidv4 } from 'uuid'
import { Cookies } from './cookies'
import { Screenshot } from './screenshot'
import type { BrowserPreRequest } from '@packages/proxy'
import type { AutomationMiddleware, OnRequestEvent } from '@packages/types'
import { cookieJar } from '../util/cookies'

export type OnBrowserPreRequest = (browserPreRequest: BrowserPreRequest) => void

export class Automation {
  private requests: Record<number, (any) => void>
  private middleware: AutomationMiddleware
  private cookies: Cookies
  private screenshot: { capture: (data: any, automate: any) => any }

  constructor (cyNamespace?: string, cookieNamespace?: string, screenshotsFolder?: string | false, public onBrowserPreRequest?: OnBrowserPreRequest, public onRequestEvent?: OnRequestEvent) {
    this.requests = {}

    // set the middleware
    this.middleware = this.initializeMiddleware()

    this.cookies = new Cookies(cyNamespace, cookieNamespace)
    this.screenshot = Screenshot(screenshotsFolder)
  }

  initializeMiddleware = (): AutomationMiddleware => {
    return {
      onPush: this.middleware?.onPush || null,
      onBeforeRequest: null,
      onRequest: null,
      onResponse: null,
      onAfterResponse: null,
    }
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
        return Bluebird.resolve(onReq(msg, data))
      }

      // do the default
      return Bluebird.resolve(this.requestAutomationResponse(msg, data, fn))
    }
  }

  requestAutomationResponse (message, data, fn) {
    return new Bluebird((resolve, reject) => {
      const id = uuidv4()

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
    return Bluebird
    .try(() => {
      fn = this.get(fn)

      if (fn) {
        return fn(...args)
      }
    })
  }

  normalize (message, data, automate?) {
    return Bluebird.try(() => {
      switch (message) {
        case 'take:screenshot':
          return this.screenshot.capture(data, automate)
        case 'get:cookies':
          return this.cookies.getCookies(data, automate)
        case 'get:cookie':
          return this.cookies.getCookie(data, automate)
        case 'set:cookie':
          return this.cookies.setCookie(data, automate)
        case 'set:cookies':
          return this.cookies.setCookies(data, automate)
        case 'add:cookies':
          return this.cookies.addCookies(data, automate)
        case 'clear:cookies':
          return Bluebird.all([
            this.cookies.clearCookies(data, automate),
            cookieJar.removeAllCookies(),
          ])
          .spread((automationResult) => automationResult)
        case 'clear:cookie':
          return Bluebird.all([
            this.cookies.clearCookie(data, automate),
            cookieJar.removeCookie(data),
          ])
          .spread((automationResult) => automationResult)
        case 'change:cookie':
          return this.cookies.changeCookie(data)
        case 'create:download':
        case 'complete:download':
          return data
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

  use (middlewares: AutomationMiddleware) {
    return this.middleware = {
      ...this.middleware,
      ...middlewares,
    }
  }

  push (message: string, data: unknown) {
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

  response = (id, resp) => {
    const request = this.requests[id]

    if (request) {
      delete request[id]

      return request(resp)
    }
  }

  get = (fn: keyof AutomationMiddleware) => {
    return this.middleware[fn]
  }
}
