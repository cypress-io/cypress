import debugModule from 'debug'
import type { Automation } from '../automation'
import type { BrowserPreRequest, BrowserResponseReceived } from '@packages/proxy'
import type { Client as WebDriverClient } from 'webdriver'
import type {
  NetworkBeforeRequestSentParameters,
  NetworkResponseStartedParameters,
  NetworkResponseCompletedParameters,
  NetworkFetchErrorParameters,
  NetworkInitiator,
  ScriptRealmDestroyedParameters,
  ScriptRealmInfo,
  NetworkCookie,
} from 'webdriver/build/bidi/localTypes'
import { CyCookie } from './webkit-automation'

const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi_automation')

const normalizeResourceType = (type: NetworkInitiator['type']) => {
  return type === 'parser' ? 'other' : type
}

const normalizeCookie = (cookie?: NetworkCookie) => {
  if (cookie) {
    return {
      name: cookie.name,
      value: cookie.value.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expiry: cookie.expiry,
    }
  }

  return null
}

export class BidiAutomation {
  #webDriverClient: WebDriverClient
  #automation: Automation
  #cachedDataUrlRequestIds: Set<string> = new Set()

  constructor (webDriverClient: WebDriverClient, automation: Automation) {
    this.#automation = automation
    this.#webDriverClient = webDriverClient

    // bind Bidi Events to update the standard automation client
    this.#webDriverClient.on('network.beforeRequestSent', this.onBeforeRequestSent.bind(this))
    this.#webDriverClient.on('network.responseStarted', this.onResponseStarted.bind(this))
    this.#webDriverClient.on('network.responseCompleted', this.onResponseComplete.bind(this))
    this.#webDriverClient.on('network.fetchError', this.onFetchError.bind(this))
    this.#webDriverClient.on('script.realmCreated', this.onRealmCreated.bind(this))
    this.#webDriverClient.on('script.realmDestroyed', this.onRealmDestroyed.bind(this))
  }

  // CDP equivalent: Network.requestWillBeSent
  private async onBeforeRequestSent (params: NetworkBeforeRequestSentParameters) {
    debugVerbose('received network.beforeRequestSend %o', params)

    let url = params.request.url

    // TODO: need to see if this is still relevant
    if (url.includes('#')) url = url.slice(0, url.indexOf('#'))

    if (url.startsWith('data:')) {
      debugVerbose('skipping data: url %s', url)
      this.#cachedDataUrlRequestIds.add(params.request.request)

      return
    }

    const parsedHeaders = {}

    params.request.headers.forEach((header) => {
      parsedHeaders[header.name] = header.value.value
    })

    const browserPreRequest: BrowserPreRequest = {
      requestId: params.request.request,
      method: params.request.method,
      url,
      headers: parsedHeaders,
      resourceType: normalizeResourceType(params.initiator.type),
      originalResourceType: params.initiator.type,
      initiator: params.initiator,
    }

    await this.#automation.onBrowserPreRequest?.(browserPreRequest)
  }

  // CDP equivalent: contains information to infer Network.requestServedFromCache
  private onResponseStarted (params: NetworkResponseStartedParameters) {
    debugVerbose('received network.responseStarted %o', params)

    if (params.response.fromCache) {
    // Filter out "data:" urls; they don't have a stored browserPreRequest
    // since they're not actually fetched
      if (this.#cachedDataUrlRequestIds.has(params.request.request)) {
        this.#cachedDataUrlRequestIds.delete(params.request.request)
        debugVerbose('skipping data: request %s', params.request.request)

        return
      }

      this.#automation.onRemoveBrowserPreRequest?.(params.request.request)
    }
  }

  // CDP equivalent: Network.responseReceived
  private onResponseComplete (params: NetworkResponseCompletedParameters) {
    debugVerbose('received network.responseComplete %o', params)

    if (params.response.fromCache) {
      this.#automation.onRemoveBrowserPreRequest?.(params.request.request)

      return
    }

    const parsedHeaders = {}

    params.response.headers.forEach((header) => {
      parsedHeaders[header.name] = header.value.value
    })

    const browserResponseReceived: BrowserResponseReceived = {
      requestId: params.request.request,
      status: params.response.status,
      headers: parsedHeaders,
    }

    this.#automation.onRequestEvent?.('response:received', browserResponseReceived)
  }

  // CDP equivalent: Network.loadingFailed
  private onFetchError (params: NetworkFetchErrorParameters) {
    debugVerbose('received network.fetchError %o', params)

    this.#automation.onRemoveBrowserPreRequest?.(params.request.request)
  }

  // CDP equivalent: trying to determine ServiceWorker.workerRegistrationUpdated
  private onRealmCreated (params: ScriptRealmInfo) {
    debugVerbose('received script.realmCreated %o', params)
    //  this.automation.onServiceWorkerRegistrationUpdated?.(params)
  }

  // CDP equivalent: trying to determine ServiceWorker.workerVersionUpdated
  private onRealmDestroyed (params: ScriptRealmDestroyedParameters) {
    debugVerbose('received script.realmDestroyed %o', params)
  }

  private async getAllCookiesMatchingFilter ({ name, domain }: {
    name?: string
    domain: string
  }) {
    // filter for storageGetCookies gets the EXACT domain of the cookie
    // Cypress expects all cookies that apply to that domain to be returned
    // For instance, domain www.foobar.com would have cookies with .foobar.com applied,
    // but sending domain=www.foobar.com would not return cookies with .foobar.com domain.

    const filter = name ?
      {
        filter: {
          name,
        },
      } : {}

    const { cookies, partitionKey } = await this.#webDriverClient.storageGetCookies(filter)

    // because of this, we get ALL gookies and filter out all cookies that apply to the given domain
    const appliedDomainCookies = cookies.filter((cookie) => {
      return `.${domain}`.includes(cookie.domain)
    })

    return appliedDomainCookies.map((cookie) => normalizeCookie(cookie))
  }

  close () {
    this.#webDriverClient.off('network.beforeRequestSent', this.onBeforeRequestSent.bind(this))
    this.#webDriverClient.off('network.responseStarted', this.onResponseStarted.bind(this))
    this.#webDriverClient.off('network.responseCompleted', this.onResponseComplete.bind(this))
    this.#webDriverClient.off('network.fetchError', this.onFetchError.bind(this))
    this.#webDriverClient.off('script.realmCreated', this.onRealmCreated.bind(this))
    this.#webDriverClient.off('script.realmDestroyed', this.onRealmDestroyed.bind(this))
  }

  onRequest = async (message, data) => {
    switch (message) {
      case 'get:cookies':
      {
        if (data.url) {
          try {
            const url = new URL(data.url)

            const cookies = await this.getAllCookiesMatchingFilter({
              domain: url.hostname,
            })

            return cookies
          } catch (e) {
            return []
          }
        }

        const { cookies } = await this.#webDriverClient.storageGetCookies({})

        return cookies
      }

      case 'get:cookie':
      {
        const cookies = await this.getAllCookiesMatchingFilter(data)

        return cookies[0] || null
      }
      case 'set:cookie':
      {
        await this.#webDriverClient.storageSetCookie({
          cookie: {
            name: data.name,
            value: {
              type: 'string',
              value: data.value,
            },
            domain: data.domain,
            path: data.path,
            httpOnly: data.httpOnly,
            secure: data.secure,
            sameSite: data.sameSite,
            expiry: data.expiry,
          },
        })

        const cookies = await this.getAllCookiesMatchingFilter(data)

        return cookies[0] || null
      }

      case 'add:cookies':

        await Promise.all(data.map((cookie) => {
          return this.#webDriverClient.storageSetCookie({
            cookie: {
              name: cookie.name,
              value: {
                type: 'string',
                value: cookie.value,
              },
              domain: cookie.domain,
              path: cookie.path,
              httpOnly: cookie.httpOnly,
              secure: cookie.secure,
              sameSite: cookie.sameSite,
              expiry: cookie.expiry,
            },
          })
        }))

        return

      case 'set:cookies':

        await this.#webDriverClient.storageDeleteCookies({})

        await Promise.all(data.map((cookie) => {
          return this.#webDriverClient.storageSetCookie({
            cookie: {
              name: cookie.name,
              value: {
                type: 'string',
                value: cookie.value,
              },
              domain: cookie.domain,
              path: cookie.path,
              httpOnly: cookie.httpOnly,
              secure: cookie.secure,
              sameSite: cookie.sameSite,
              expiry: cookie.expiry,
            },
          })
        }))

        return
      case 'clear:cookie':

        await this.#webDriverClient.storageDeleteCookies({})

        return

      case 'clear:cookies':
      {
        const { cookies: cookiesToClear } = await this.#webDriverClient.storageGetCookies({})

        await this.#webDriverClient.storageDeleteCookies({})

        return cookiesToClear
      }

      case 'is:automation:client:connected':
        return true
      case 'take:screenshot':
      {
        const { contexts } = await this.#webDriverClient.browsingContextGetTree({})

        const cypressContext = contexts[0].context

        // make sure the main cypress context is focused before taking a screenshot
        await this.#webDriverClient.browsingContextActivate({
          context: cypressContext,
        })

        const { data: base64EncodedScreenshot } = await this.#webDriverClient.browsingContextCaptureScreenshot({
          context: contexts[0].context,
          format: {
            type: 'png',
          },
        })

        return `data:image/png;base64,${base64EncodedScreenshot}`
      }

      case 'reset:browser:state':

        // patch this for now just to get clean cookies between tests
        // we really need something similar to the Storage.clearDataForOrigin and Network.clearBrowserCache methods here,
        // or the web extension https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browsingData/remove API
        await this.#webDriverClient.storageDeleteCookies({})

        return
      case 'reset:browser:tabs:for:next:spec':
        {
          const { contexts } = await this.#webDriverClient.browsingContextGetTree({})

          if (data.shouldKeepTabOpen) {
            await this.#webDriverClient.browsingContextCreate({
              type: 'tab',
            })
          }

          // CLOSE ALL BUT THE NEW CONTEXT, which makes it active
          // also do not need to navigate to about:blank as this happens by default
          for (const context of contexts) {
            await this.#webDriverClient.browsingContextClose({
              context: context.context,
            })
          }

          // await this.#webDriverClient.browsingContextActivate({
          //   context: newContext.context,
          // })

          // await this.#webDriverClient.browsingContextNavigate({
          //   context: newContext.context,
          //   url: 'about:blank',
          // })
        }

        return
      case 'focus:browser:window':
        {
          const { contexts } = await this.#webDriverClient.browsingContextGetTree({})

          const cypressContext = contexts[0].context

          await this.#webDriverClient.browsingContextActivate({
            context: cypressContext,
          })
        }

        return
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }
}
