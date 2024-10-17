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
  BrowsingContextInfo,
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
  #AUTContextId: string | undefined = undefined
  // set in firefox-utils when creating the webdriver session initially and in the 'reset:browser:tabs:for:next:spec' automation hook for subsequent tests when the top level context is recreated
  topLevelContextId: string | undefined = undefined
  #interceptId: string | undefined = undefined

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
    this.#webDriverClient.on('browsingContext.contextCreated', this.onBrowsingContextCreated.bind(this))
    this.#webDriverClient.on('browsingContext.contextDestroyed', this.onBrowsingContextDestroyed.bind(this))
  }

  setTopLevelContextId (contextId: string) {
    this.topLevelContextId = contextId
  }

  private async onBrowsingContextCreated (params: BrowsingContextInfo) {
    // the AUT iframe is always the FIRST child created by the top level parent (second is the reporter, if it exists which isnt the case for headless/test replay)
    if (!this.#AUTContextId && params.parent && this.topLevelContextId === params.parent) {
      this.#AUTContextId = params.context

      // in the case of top reloads for setting the url between specs, the AUT context gets destroyed but the top level context still exists.
      // in this case, we do NOT have to redefined the top level context intercept but instead update the AUTContextId to properly identify the
      // AUT in the request interceptor.
      if (!this.#interceptId) {
        // BiDi can only intercept top level tab contexts (i.e., not iframes), so the intercept needs to be defined on the top level parent, which is the AUTs
        // direct parent in ALL cases. This gets cleaned up in the 'reset:browser:tabs:for:next:spec' automation hook.
        // error looks something like: Error: WebDriver Bidi command "network.addIntercept" failed with error: invalid argument - Context with id 123456789 is not a top-level browsing context
        const { intercept } = await this.#webDriverClient.networkAddIntercept({ phases: ['beforeRequestSent'], contexts: [params.parent] })

        // save a reference to the intercept ID to be cleaned up in the 'reset:browser:tabs:for:next:spec' automation hook.
        this.#interceptId = intercept
      }
    }
  }

  private async onBrowsingContextDestroyed (params: BrowsingContextInfo) {
    // if the top level context gets destroyed, we need to clear the AUT context and destroy the interceptor as it is no longer applicable
    if (params.context === this.topLevelContextId) {
      if (this.#interceptId) {
        // since we either have:
        //   1. a new upper level browser context created above with shouldKeepTabOpen set to true.
        //   2. all the previous contexts are destroyed.
        // we should clean up our top level interceptor to prevent a memory leak as we no longer need it
        await this.#webDriverClient.networkRemoveIntercept({
          intercept: this.#interceptId,
        })

        this.#interceptId = undefined
      }

      this.topLevelContextId = undefined
    }

    // if the AUT context is destroyed (possible that the top level context did not), clear the AUT context Id
    if (params.context === this.#AUTContextId) {
      this.#AUTContextId = undefined
    }
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

    // since all requests coming from the top level context are blocked, we need to continue them here
    // we only want to mutate requests coming from the AUT frame so we can add the X-Cypress-Is-AUT-Frame header
    // so the request-middleware can identify the request
    if (url.includes('verify-cookie-login')) {
      debugger
    }

    if (params.isBlocked) {
      if (params.context === this.#AUTContextId) {
        params.request.headers.push({
          name: 'X-Cypress-Is-AUT-Frame',
          value: {
            type: 'string',
            value: 'true',
          },
        })
      }

      /**
       *     request: NetworkRequest;
    cookies?: NetworkCookieHeader[];
    body?: NetworkBytesValue;
    headers?: NetworkHeader[];
    method?: string;
    url?: string;
       */
      await this.#webDriverClient.networkContinueRequest({
        request: params.request.request,
        headers: params.request.headers,
        cookies: params.request.cookies,
      })
    }
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
    this.#webDriverClient.off('browsingContext.contextCreated', this.onBrowsingContextCreated.bind(this))
    this.#webDriverClient.off('browsingContext.contextDestroyed', this.onBrowsingContextDestroyed.bind(this))
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
            const newTopLevelContext = await this.#webDriverClient.browsingContextCreate({
              type: 'tab',
            })

            this.setTopLevelContextId(newTopLevelContext.context)
            this.#AUTContextId = undefined
          }

          // CLOSE ALL BUT THE NEW CONTEXT, which makes it active
          // also do not need to navigate to about:blank as this happens by default
          for (const context of contexts) {
            await this.#webDriverClient.browsingContextClose({
              context: context.context,
            })
          }

          // if (this.#interceptId) {
          //   // since we either have:
          //   //   1. a new upper level browser context created above with shouldKeepTabOpen set to true.
          //   //   2. all the previous contexts are destroyed.
          //   // we should clean up our top level interceptor to prevent a memory leak as we no longer need it
          //   await this.#webDriverClient.networkRemoveIntercept({
          //     intercept: this.#interceptId,
          //   })

          //   this.#interceptId = undefined
          // }
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
