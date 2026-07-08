/// <reference types='chrome'/>

import _ from 'lodash'
import type { Protocol } from 'devtools-protocol'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import { isLocalhost as isLocalhostNetworkTools } from '@packages/network-tools'
import debugModule from 'debug'
import { URL } from 'url'
import { performance } from 'perf_hooks'

import type { ResourceType, BrowserPreRequest, BrowserResponseReceived } from '@packages/proxy'
import type { CDPClient, ProtocolManagerShape, WriteVideoFrame, AutomationMiddleware, AutomationCommands } from '@packages/types'
import type { Automation } from '../../automation'
import { cookieMatches, CyCookie, CyCookieFilter } from '../../automation/cookie/util'
import { normalizeGetCookies, normalizeSetCookieProps } from '../../automation/cookie/converters/cdp'
import { DEFAULT_NETWORK_ENABLE_OPTIONS, CriClient } from './cri-client'
import { cdpKeyPress } from '../../automation/commands/key_press'

import { toSupportedKey, AUT_FRAME_NAME_IDENTIFIER } from '@packages/types'

import { cdpGetUrl } from '../../automation/commands/get_url'
import { cdpReloadFrame } from '../../automation/commands/reload_frame'
import { cdpNavigateHistory } from '../../automation/commands/navigate_history'
import { cdpGetFrameTitle } from '../../automation/commands/get_frame_title'

export type CdpCommand = keyof ProtocolMapping.Commands

export type CdpEvent = keyof ProtocolMapping.Events

const debugVerbose = debugModule('cypress-verbose:server:browsers:cdp_automation')

export function screencastOpts (everyNthFrame = Number(process.env.CYPRESS_EVERY_NTH_FRAME || 5)): Protocol.Page.StartScreencastRequest {
  return {
    format: 'jpeg',
    everyNthFrame,
  }
}

export const normalizeResourceType = (resourceType: string | undefined): ResourceType => {
  resourceType = resourceType ? resourceType.toLowerCase() : 'unknown'
  if (validResourceTypes.includes(resourceType as ResourceType)) {
    return resourceType as ResourceType
  }

  return 'other'
}

export type SendDebuggerCommand = <T extends CdpCommand>(message: T, data?: ProtocolMapping.Commands[T]['paramsType'][0], sessionId?: string) => Promise<ProtocolMapping.Commands[T]['returnType']>

export type OnFn = <T extends CdpEvent>(eventName: T, cb: (data: ProtocolMapping.Events[T][0], sessionId?: string) => void) => void

export type OffFn = <T extends CdpEvent>(eventName: T, cb: (data: any) => void) => void

type SendCloseCommand = (shouldKeepTabOpen: boolean) => Promise<any> | void
interface HasFrame {
  frame: Protocol.Page.Frame
}

// the resource types passed through to request middleware / cy.intercept matching; any
// other type reported by the protocol (e.g. 'document', 'media', 'preflight') normalizes to 'other'
// CDP: https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-ResourceType
const validResourceTypes: ResourceType[] = ['fetch', 'xhr', 'websocket', 'stylesheet', 'script', 'image', 'font', 'cspviolationreport', 'ping', 'manifest', 'other']

export class CdpAutomation implements CDPClient, AutomationMiddleware {
  on: OnFn
  off: OffFn
  send: SendDebuggerCommand
  private frameTree: Protocol.Page.FrameTree | undefined
  private gettingFrameTree: Promise<void> | undefined | null
  private cachedDataUrlRequestIds: Set<string> = new Set()
  private executionContexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription> = new Map()

  private constructor (private sendDebuggerCommandFn: SendDebuggerCommand, private onFn: OnFn, private offFn: OffFn, private sendCloseCommandFn: SendCloseCommand, private automation: Automation, private focusTabOnScreenshot: boolean = false, private isHeadless: boolean = false) {
    onFn('Network.requestWillBeSent', this.onNetworkRequestWillBeSent)
    onFn('Network.responseReceived', this.onResponseReceived)
    onFn('Network.requestServedFromCache', this.onRequestServedFromCache)
    onFn('Network.loadingFailed', this.onRequestFailed)
    onFn('ServiceWorker.workerRegistrationUpdated', this.onServiceWorkerRegistrationUpdated)
    onFn('ServiceWorker.workerVersionUpdated', this.onServiceWorkerVersionUpdated)

    onFn('Runtime.executionContextCreated', this.onExecutionContextCreated)
    onFn('Runtime.executionContextDestroyed', this.onExecutionContextDestroyed)

    this.on = onFn
    this.off = offFn
    this.send = sendDebuggerCommandFn
  }

  async startVideoRecording (writeVideoFrame: WriteVideoFrame, screencastOpts) {
    this.onFn('Page.screencastFrame', async (e) => {
      writeVideoFrame(Buffer.from(e.data, 'base64'))
      try {
        await this.sendDebuggerCommandFn('Page.screencastFrameAck', { sessionId: e.sessionId })
      } catch (e) {
        // swallow this error if the CRI connection was reset
        if (!e.message.includes('browser CRI connection was reset')) {
          throw e
        }
      }
    })

    await this.sendDebuggerCommandFn('Page.startScreencast', screencastOpts)
  }

  static async create (sendDebuggerCommandFn: SendDebuggerCommand, onFn: OnFn, offFn: OffFn, sendCloseCommandFn: SendCloseCommand, automation: Automation, protocolManager?: ProtocolManagerShape, focusTabOnScreenshot: boolean = false, isHeadless?: boolean): Promise<CdpAutomation> {
    const cdpAutomation = new CdpAutomation(sendDebuggerCommandFn, onFn, offFn, sendCloseCommandFn, automation, focusTabOnScreenshot, isHeadless)

    await sendDebuggerCommandFn('Network.enable', protocolManager?.networkEnableOptions ?? DEFAULT_NETWORK_ENABLE_OPTIONS)

    return cdpAutomation
  }

  private async activateMainTab () {
    const ActivationTimeoutMessage = 'Unable to communicate with Cypress Extension'

    const sendActivationMessage = `
      (() => {
        if (document.defaultView !== top) { return Promise.resolve() }
        return new Promise((res) => {
          const onMessage = (ev) => {
            if (ev.data.message === 'cypress:extension:main:tab:activated') {
              window.removeEventListener('message', onMessage)
              res()
            }
          }

          window.addEventListener('message', onMessage)
          window.postMessage({ message: 'cypress:extension:activate:main:tab' })
        })
      })()`

    if (this.isHeadless) {
      debugVerbose('Headless, so bringing page to front instead of negotiating with extension')
      await this.sendDebuggerCommandFn('Page.bringToFront')
    } else {
      try {
        debugVerbose('sending activation message ', sendActivationMessage)
        await Promise.race([
          this.sendDebuggerCommandFn('Runtime.evaluate', {
            expression: sendActivationMessage,
            awaitPromise: true,
          }),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error(ActivationTimeoutMessage)), 500)
          }),
        ])
      } catch (e) {
        debugVerbose('Error occurred while attempting to activate main tab: ', e)
        // If rejected due to timeout, fall back to bringing the main tab to focus -
        // this will steal window focus, so it is a last resort. If any other error
        // was thrown, re-throw as it was unexpected.
        if ((e as Error).message === ActivationTimeoutMessage) {
          await this.sendDebuggerCommandFn('Page.bringToFront')
        } else {
          throw e
        }
      }
    }
  }

  private onNetworkRequestWillBeSent = async (params: Protocol.Network.RequestWillBeSentEvent) => {
    debugVerbose('received networkRequestWillBeSent %o', params)

    const url = params.request.url

    // Filter out "data:" urls from being cached - fixes: https://github.com/cypress-io/cypress/issues/17853
    // Chrome sends `Network.requestWillBeSent` events with data urls which won't actually be fetched
    // Example data url: "data:font/woff;base64,<base64 encoded string>"
    if (url.startsWith('data:')) {
      debugVerbose('skipping data: url %s', url)
      this.cachedDataUrlRequestIds.add(params.requestId)

      return
    }

    // Firefox: https://searchfox.org/mozilla-central/rev/98a9257ca2847fad9a19631ac76199474516b31e/remote/cdp/domains/parent/Network.jsm#397
    // Firefox lacks support for urlFragment and initiator, two nice-to-haves
    const browserPreRequest: BrowserPreRequest = {
      requestId: params.requestId,
      method: params.request.method,
      url,
      headers: params.request.headers,
      resourceType: normalizeResourceType(params.type),
      originalResourceType: params.type,
      initiator: params.initiator,
      documentURL: params.documentURL,
      hasRedirectResponse: params.redirectResponse != null,
      // wallTime is in seconds: https://vanilla.aslushnikov.com/?Network.TimeSinceEpoch
      // normalize to milliseconds to be comparable to everything else we're gathering
      cdpRequestWillBeSentTimestamp: params.wallTime * 1000,
      cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin,
    }

    await this.automation.onBrowserPreRequest?.(browserPreRequest)
  }

  private onRequestServedFromCache = (params: Protocol.Network.RequestServedFromCacheEvent) => {
    debugVerbose('received onRequestServedFromCache %o', params)

    // Filter out "data:" urls; they don't have a stored browserPreRequest
    // since they're not actually fetched
    if (this.cachedDataUrlRequestIds.has(params.requestId)) {
      this.cachedDataUrlRequestIds.delete(params.requestId)
      debugVerbose('skipping data: request %s', params.requestId)

      return
    }

    this.automation.onRemoveBrowserPreRequest?.(params.requestId)
  }

  private onRequestFailed = (params: Protocol.Network.LoadingFailedEvent) => {
    this.automation.onRemoveBrowserPreRequest?.(params.requestId)
  }

  private onResponseReceived = (params: Protocol.Network.ResponseReceivedEvent) => {
    if (params.response.fromDiskCache || (params.response.fromServiceWorker && params.response.encodedDataLength <= 0)) {
      this.automation.onRemoveBrowserPreRequest?.(params.requestId)

      return
    }

    const browserResponseReceived: BrowserResponseReceived = {
      requestId: params.requestId,
      status: params.response.status,
      headers: params.response.headers,
    }

    this.automation.onRequestEvent?.('response:received', browserResponseReceived)
  }

  private onServiceWorkerRegistrationUpdated = (params: Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent) => {
    this.automation.onServiceWorkerRegistrationUpdated?.(params)
  }

  private onServiceWorkerVersionUpdated = (params: Protocol.ServiceWorker.WorkerVersionUpdatedEvent) => {
    this.automation.onServiceWorkerVersionUpdated?.(params)
  }

  private onExecutionContextCreated = (event: Protocol.Runtime.ExecutionContextCreatedEvent) => {
    debugVerbose('new execution context:', event)
    this.executionContexts.set(event.context.id, event.context)
  }

  private onExecutionContextDestroyed = (event: Protocol.Runtime.ExecutionContextDestroyedEvent) => {
    debugVerbose('removing execution context', event)
    if (this.executionContexts.has(event.executionContextId)) {
      this.executionContexts.delete(event.executionContextId)
    }
  }

  private getAllCookies = async (filter: CyCookieFilter) => {
    const result: Protocol.Network.GetAllCookiesResponse = await this.sendDebuggerCommandFn('Network.getAllCookies')

    return normalizeGetCookies(result.cookies)
    .filter((cookie: CyCookie) => {
      const matches = cookieMatches(cookie, filter)

      debugVerbose('cookie matches filter? %o', { matches, cookie, filter })

      return matches
    })
  }

  private getCookiesByUrl = async (url): Promise<CyCookie[]> => {
    const result: Protocol.Network.GetCookiesResponse = await this.sendDebuggerCommandFn('Network.getCookies', {
      urls: [url],
    })

    const isLocalhost = isLocalhostNetworkTools(new URL(url))

    return normalizeGetCookies(result.cookies)
    .filter((cookie) => {
      // Chrome returns all cookies for a URL, even if they wouldn't normally
      // be sent with a request. This standardizes it by filtering out ones
      // that are secure but not on a secure context

      // localhost is considered a secure context (even when http:)
      // and it's required for cross origin support when visiting a secondary
      // origin so that all its cookies are sent.
      return !(cookie.secure && url.startsWith('http:') && !isLocalhost)
    })
  }

  private getCookie = async (filter: CyCookieFilter): Promise<CyCookie | null> => {
    const cookies = await this.getAllCookies(filter)

    return _.get(cookies, 0, null)
  }

  private _updateFrameTree = (client: CriClient, eventName) => async () => {
    debugVerbose(`update frame tree for ${eventName}`)

    this.gettingFrameTree = (async () => {
      try {
        this.frameTree = (await client.send('Page.getFrameTree')).frameTree
        debugVerbose('frame tree updated')
      } catch (err) {
        debugVerbose('failed to update frame tree:', err.stack)
      } finally {
        this.gettingFrameTree = null
      }
    })()
  }

  private _continueRequest = (client, params, header?) => {
    const details: Protocol.Fetch.ContinueRequestRequest = {
      requestId: params.requestId,
    }

    if (header) {
    // headers are received as an object but need to be an array
    // to modify them
      const currentHeaders = _.map(params.request.headers, (value, name) => ({ name, value }))

      details.headers = [
        ...currentHeaders,
        header,
      ]
    }

    debugVerbose('continueRequest: %o', details)

    client.send('Fetch.continueRequest', details).catch((err) => {
    // swallow this error so it doesn't crash Cypress.
    // an "Invalid InterceptionId" error can randomly happen in the driver tests
    // when testing the redirection loop limit, when a redirect request happens
    // to be sent after the test has moved on. this shouldn't crash Cypress, in
    // any case, and likely wouldn't happen for standard user tests, since they
    // will properly fail and not move on like the driver tests
      debugVerbose('continueRequest failed, url: %s, error: %s', params.request.url, err?.stack || err)
    })
  }

  private _isAUTFrame = async (frameId: string) => {
    debugVerbose('need frame tree')

    // the request could come in while in the middle of getting the frame tree,
    // which is asynchronous, so wait for it to be fetched
    if (this.gettingFrameTree) {
      debugVerbose('awaiting frame tree')

      await this.gettingFrameTree
    }

    const frame = _.find(this.frameTree?.childFrames || [], ({ frame }) => {
      return frame?.name?.startsWith(AUT_FRAME_NAME_IDENTIFIER)
    }) as HasFrame | undefined

    if (frame) {
      return frame.frame.id === frameId
    }

    return false
  }

  private _getAutFrame = async () => {
    try {
      if (this.gettingFrameTree) {
        debugVerbose('awaiting frame tree')

        await this.gettingFrameTree
      }

      const frameTree = (await this.send('Page.getFrameTree')).frameTree

      let frame = _.find(frameTree?.childFrames || [], (item: HasFrame) => {
        return item.frame?.name?.startsWith(AUT_FRAME_NAME_IDENTIFIER)
      }) as HasFrame | undefined

      // If we are in E2E Cypress in Cypress testing, we need to get the frame from the child frames of the AUT frame. Else we are reloading what would be the "top" frame under test (with the AUT and reporter_)
      if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF && frame) {
        // @ts-expect-error
        frame = _.find(frame?.childFrames || [], (item: HasFrame) => {
          return item.frame?.name?.startsWith(AUT_FRAME_NAME_IDENTIFIER)
        }) as HasFrame | undefined
      }

      if (!frame) {
        // if for whatever reason we cannot identify the AUT frame by name, we will fall back to the first child frame that exists.
        // The first child frame should always be the AUT frame, followed by the spec frame
        if (frameTree?.childFrames?.[0]) {
          frame = frameTree.childFrames[0]
        } else {
          throw new Error('Could not find AUT frame')
        }
      }

      return frame.frame
    } catch (err) {
      debugVerbose('failed to get aut frame:', err.stack)

      throw new Error('Could not find AUT frame')
    }
  }

  _handlePausedRequests = async (client: CriClient) => {
    // NOTE: only supported in chromium based browsers
    await client.send('Fetch.enable', {
      // only enable request pausing for documents to determine the AUT iframe
      patterns: [{
        resourceType: 'Document',
      }],
    })

    // adds a header to the request to mark it as a request for the AUT frame
    // itself, so the proxy can utilize that for injection purposes
    client.on('Fetch.requestPaused', async (params: Protocol.Fetch.RequestPausedEvent) => {
      if (await this._isAUTFrame(params.frameId)) {
        debugVerbose('add X-Cypress-Is-AUT-Frame header to: %s', params.request.url)

        return this._continueRequest(client, params, {
          name: 'X-Cypress-Is-AUT-Frame',
          value: 'true',
        })
      }

      return this._continueRequest(client, params)
    })
  }

  // we can't get the frame tree during the Fetch.requestPaused event, because
  // the CDP is tied up during that event and can't be utilized. so we maintain
  // a reference to it that's updated when it's likely to have been changed
  _listenForFrameTreeChanges = (client: CriClient) => {
    debugVerbose('listen for frame tree changes')

    client.on('Page.frameAttached', this._updateFrameTree(client, 'Page.frameAttached'))
    client.on('Page.frameDetached', this._updateFrameTree(client, 'Page.frameDetached'))
  }

  onRequest = async <T extends keyof AutomationCommands>(message: T, data: AutomationCommands[T]['dataType']): Promise<AutomationCommands[T]['returnType']> => {
    let setCookie

    switch (message) {
      case 'get:cookies':
        if (data.url) {
          return this.getCookiesByUrl(data.url)
        }

        return this.getAllCookies(data)
      case 'get:cookie':
        return this.getCookie(data)
      case 'set:cookie': {
        setCookie = normalizeSetCookieProps(data)

        const result: Protocol.Network.SetCookieResponse = await this.sendDebuggerCommandFn('Network.setCookie', setCookie)

        if (!result.success) {
          // i wish CDP provided some more detail here, but this is really it in v1.3
          // @see https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie
          throw new Error(`Network.setCookie failed to set cookie: ${JSON.stringify(setCookie)}`)
        }

        return this.getCookie(data)
      }

      case 'add:cookies':
        setCookie = data.map((cookie) => normalizeSetCookieProps(cookie)) as Protocol.Network.SetCookieRequest[]

        return this.sendDebuggerCommandFn('Network.setCookies', { cookies: setCookie })

      case 'set:cookies':
        setCookie = data.map((cookie) => normalizeSetCookieProps(cookie))

        await this.sendDebuggerCommandFn('Network.clearBrowserCookies')

        return this.sendDebuggerCommandFn('Network.setCookies', { cookies: setCookie })

      case 'clear:cookie': {
        // always resolve with the value of the removed cookie. also, getting
        // the cookie via CDP first will ensure that we send a cookie `domain`
        // to CDP that matches the cookie domain that is really stored
        const cookieToBeCleared = await this.getCookie(data)

        if (!cookieToBeCleared) {
          return cookieToBeCleared
        }

        await this.sendDebuggerCommandFn('Network.deleteCookies', _.pick(cookieToBeCleared, 'name', 'domain'))

        return cookieToBeCleared
      }

      case 'clear:cookies': {
        const clearedCookies: CyCookie[] = []

        for (const cookie of data as CyCookieFilter[]) {
          // resolve with the value of the removed cookie
          // also, getting the cookie via CDP first will ensure that we send a cookie `domain` to CDP
          // that matches the cookie domain that is really stored
          const cookieToBeCleared = await this.getCookie(cookie)

          // if the cookie no longer exists, there is nothing to clear or report back
          if (!cookieToBeCleared) {
            continue
          }

          await this.sendDebuggerCommandFn('Network.deleteCookies', _.pick(cookieToBeCleared, 'name', 'domain'))

          clearedCookies.push(cookieToBeCleared)
        }

        return clearedCookies
      }

      case 'is:automation:client:connected':
        return true
      case 'remote:debugger:protocol':
        return this.sendDebuggerCommandFn(data.command, data.params, data.sessionId)
      case 'take:screenshot': {
        debugVerbose('capturing screenshot')

        if (this.focusTabOnScreenshot) {
          try {
            await this.activateMainTab()
          } catch (e) {
            debugVerbose('Error while attempting to activate main tab: %o', e)
          }
        }

        let screenshot: Protocol.Page.CaptureScreenshotResponse

        try {
          screenshot = await this.sendDebuggerCommandFn('Page.captureScreenshot', { format: 'png' })
        } catch (err) {
          throw new Error(`The browser responded with an error when Cypress attempted to take a screenshot.\n\nDetails:\n${err.message}`)
        }

        return `data:image/png;base64,${screenshot.data}`
      }
      case 'reset:browser:state':
        return Promise.all([
          // Note that we are omitting `file_systems` as it is very non-performant to clear:
          // https://github.com/cypress-io/cypress/pull/32703
          this.sendDebuggerCommandFn('Storage.clearDataForOrigin', { origin: '*', storageTypes: 'cookies,indexeddb,local_storage,shader_cache,service_workers,cache_storage,interest_groups,shared_storage' }),
          this.sendDebuggerCommandFn('Network.clearBrowserCache'),
        ])
      case 'reset:browser:tabs:for:next:spec':
        return this.sendCloseCommandFn(data.shouldKeepTabOpen)
      case 'focus:browser:window':
        return this.sendDebuggerCommandFn('Page.bringToFront')
      case 'get:heap:size:limit':
        return this.sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' })
      case 'collect:garbage':
        return this.sendDebuggerCommandFn('HeapProfiler.collectGarbage')
      case 'key:press':
        return cdpKeyPress(toSupportedKey(data.key), this.sendDebuggerCommandFn, this.executionContexts, (await this.send('Page.getFrameTree')).frameTree)
      case 'get:aut:url':
        return cdpGetUrl(this.sendDebuggerCommandFn, this.executionContexts, await this._getAutFrame())
      case 'reload:aut:frame':
        return cdpReloadFrame(this.sendDebuggerCommandFn, this.executionContexts, await this._getAutFrame(), data.forceReload)
      case 'navigate:aut:history':
        return cdpNavigateHistory(this.sendDebuggerCommandFn, this.executionContexts, await this._getAutFrame(), data.historyNumber)
      case 'get:aut:title':
        return cdpGetFrameTitle(this.sendDebuggerCommandFn, this.executionContexts, await this._getAutFrame())
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }
}
