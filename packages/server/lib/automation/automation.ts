import Bluebird from 'bluebird'
import { v4 as uuidv4 } from 'uuid'
import { Cookies } from './cookies'
import { Screenshot } from './screenshot'
import type { BrowserPreRequest } from '@packages/proxy'
import type { AutomationMiddleware, OnRequestEvent, OnServiceWorkerClientSideRegistrationUpdated, OnServiceWorkerRegistrationUpdated, OnServiceWorkerVersionUpdated } from '@packages/types'
import { cookieJar } from '../util/cookies'
import type { ServiceWorkerEventHandler } from '@packages/proxy/lib/http/util/service-worker-manager'
import Debug from 'debug'

const debug = Debug('cypress:server:automation')

export type OnBrowserPreRequest = (browserPreRequest: BrowserPreRequest) => Promise<void>

export type AutomationOptions = {
  cyNamespace?: string
  cookieNamespace?: string
  screenshotsFolder?: string | false
  onBrowserPreRequest?: OnBrowserPreRequest
  onRequestEvent?: OnRequestEvent
  onRemoveBrowserPreRequest?: (requestId: string) => void
  onDownloadLinkClicked?: (downloadUrl: string) => void
  onServiceWorkerRegistrationUpdated?: OnServiceWorkerRegistrationUpdated
  onServiceWorkerVersionUpdated?: OnServiceWorkerVersionUpdated
  onServiceWorkerClientSideRegistrationUpdated?: OnServiceWorkerClientSideRegistrationUpdated
  onServiceWorkerClientEvent: ServiceWorkerEventHandler
}

interface CommandSignature<P = any, R = any> {
  dataType: P
  returnType: R
}

export interface AutomationCommands {
  'take:screenshot': CommandSignature
  'get:cookies': CommandSignature
  'get:cookie': CommandSignature
  'set:cookie': CommandSignature
  'set:cookies': CommandSignature
  'add:cookies': CommandSignature
  'clear:cookies': CommandSignature
  'clear:cookie': CommandSignature
  'change:cookie': CommandSignature
  'create:download': CommandSignature
  'canceled:download': CommandSignature
  'complete:download': CommandSignature
  'get:heap:size:limit': CommandSignature
  'collect:garbage': CommandSignature
  'reset:browser:tabs:for:next:spec': CommandSignature
  'reset:browser:state': CommandSignature
  'focus:browser:window': CommandSignature
  'is:automation:client:connected': CommandSignature
}

export class Automation {
  private requests: Record<number, (any) => void>
  private middleware: AutomationMiddleware
  private cookies: Cookies
  private screenshot: { capture: (data: any, automate: any) => any }
  public onBrowserPreRequest: OnBrowserPreRequest | undefined
  public onRequestEvent: OnRequestEvent | undefined
  public onRemoveBrowserPreRequest: ((requestId: string) => void) | undefined
  public onDownloadLinkClicked: ((downloadUrl: string) => void) | undefined
  public onServiceWorkerRegistrationUpdated: OnServiceWorkerRegistrationUpdated | undefined
  public onServiceWorkerVersionUpdated: OnServiceWorkerVersionUpdated | undefined
  public onServiceWorkerClientSideRegistrationUpdated: OnServiceWorkerClientSideRegistrationUpdated | undefined
  public onServiceWorkerClientEvent: ServiceWorkerEventHandler

  constructor (options: AutomationOptions) {
    this.onBrowserPreRequest = options.onBrowserPreRequest
    this.onRequestEvent = options.onRequestEvent
    this.onRemoveBrowserPreRequest = options.onRemoveBrowserPreRequest
    this.onDownloadLinkClicked = options.onDownloadLinkClicked
    this.onServiceWorkerRegistrationUpdated = options.onServiceWorkerRegistrationUpdated
    this.onServiceWorkerVersionUpdated = options.onServiceWorkerVersionUpdated
    this.onServiceWorkerClientSideRegistrationUpdated = options.onServiceWorkerClientSideRegistrationUpdated
    this.onServiceWorkerClientEvent = options.onServiceWorkerClientEvent

    this.requests = {}

    // set the middleware
    this.middleware = this.initializeMiddleware()

    this.cookies = new Cookies(options.cyNamespace, options.cookieNamespace)
    this.screenshot = Screenshot(options.screenshotsFolder)
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

  automationValve<T extends keyof AutomationCommands> (message: T, fn: (...args: any) => any) {
    return (
      msg: T | AutomationCommands[T]['dataType'],
      data: T extends keyof AutomationCommands ? AutomationCommands[T]['dataType'] : never,
    ) => {
      const resolvedData = data ?? msg as AutomationCommands[T]['dataType']
      const resolvedMessage = data ? msg : message

      const onReq = this.get('onRequest')

      if (onReq) {
        return Bluebird.resolve(onReq(resolvedMessage, resolvedData))
      }

      return Bluebird.resolve(this.requestAutomationResponse(resolvedMessage, resolvedData, fn))
    }
  }

  requestAutomationResponse (message: string, data: any, fn: (...args: any) => any) {
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

  async invokeAsync (fn, ...args) {
    const invocationTarget = this.get(fn) as (...args: any[]) => Promise<any>

    if (invocationTarget) {
      try {
        return await invocationTarget(...args)
      } catch (err: unknown) {
        debug('invokeAsync on %s failed: %s', fn, err)
      }
    }
  }

  normalize<T extends keyof AutomationCommands> (message: T, data: AutomationCommands[T]['dataType'], automate?): Promise<AutomationCommands[T]['returnType']> {
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
        case 'canceled:download':
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

  async push<T extends keyof AutomationCommands> (message: T, data: AutomationCommands[T]['dataType']) {
    const result = await this.normalize(message, data)

    if (result) {
      await this.invokeAsync('onPush', message, result)
    }
  }

  async request<T extends keyof AutomationCommands> (message: T, data: AutomationCommands[T]['dataType'], fn) {
    // curry in the message + callback function
    // for obtaining the external automation data
    const automate = this.automationValve(message, fn)

    await this.invokeAsync('onBeforeRequest', message, data)

    const resp = await this.normalize(message, data, automate)

    await this.invokeAsync('onAfterResponse', message, data, resp)

    return resp
  }

  response = (id, resp) => {
    const request = this.requests[id]

    if (request) {
      delete request[id]

      return request(resp)
    }
  }

  get = <K extends keyof AutomationMiddleware>(fn: K): AutomationMiddleware[K] => {
    return this.middleware[fn]
  }
}
