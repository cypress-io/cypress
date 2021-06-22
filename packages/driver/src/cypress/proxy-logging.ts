import { Interception } from '@packages/net-stubbing/lib/types'
import { BrowserPreRequest, BrowserResponseReceived } from '@packages/proxy/lib/types'
import Debug from 'debug'

const debug = Debug('cypress:driver:proxy-logging')

/**
 * Remove and return the first element from `array` for which `filterFn` returns a truthy value.
 */
function take<E> (array: E[], filterFn: (data: E) => boolean) {
  for (const i in array) {
    const e = array[i]

    if (!filterFn(e)) continue

    array.splice(i as unknown as number, 1)

    return e
  }

  return
}

function getDisplayUrl (url: string) {
  if (url.startsWith(window.location.origin)) {
    return url.slice(window.location.origin.length)
  }

  return url
}

function getRequestLogConfig (req: Omit<ProxyRequest, 'log'>): Partial<Cypress.LogConfig> {
  return {
    displayName: req.preRequest.resourceType,
    // TOOD: this just gets us the indicator, update this to not be 'xhr'
    name: 'xhr',
    type: 'parent',
    event: true,
    url: req.preRequest.url,
    method: req.preRequest.method,
    timeout: 0,
    consoleProps: () => {
      const consoleProps = {
        Method: req.preRequest.method,
        URL: req.preRequest.url,
        'Resource Type': req.preRequest.resourceType,
        'Request Headers': req.preRequest.headers,
      }

      if (req.responseReceived) {
        _.assign(consoleProps, {
          'Response Status Code': req.responseReceived.status,
          'Response Headers': req.responseReceived.headers,
        })
      }

      return consoleProps
    },
    renderProps: () => {
      function getIndicator (): 'aborted' | 'pending' | 'successful' | 'bad' {
        if (!req.responseReceived) {
          return 'pending'
        }

        if (req.responseReceived.status >= 200 && req.responseReceived.status <= 299) {
          return 'successful'
        }

        return 'bad'
      }

      const message = _.compact([
        req.preRequest.method,
        req.responseReceived && req.responseReceived.status,
        getDisplayUrl(req.preRequest.url),
      ]).join(' ')

      return {
        indicator: getIndicator(),
        message,
      }
    },
  }
}

function updateXhrLog (log: Cypress.Log, browserPreRequest: BrowserPreRequest) {
  log.set({ browserPreRequest })
}

type UnmatchedProxyLog = {
  browserPreRequest: BrowserPreRequest
  log: Cypress.Log
}

type ProxyRequest = {
  log: Cypress.Log
  preRequest: BrowserPreRequest
  responseReceived?: BrowserResponseReceived
}

type UnmatchedXhrLog = {
  xhr: Cypress.WaitXHR
  log: Cypress.Log
}

export class ProxyLogging {
  unmatchedProxyLogs: Array<UnmatchedProxyLog> = []
  unmatchedXhrLogs: Array<UnmatchedXhrLog> = []
  proxyRequests: Array<ProxyRequest> = []

  constructor (private Cypress: Cypress.Cypress) {
    Cypress.on('proxy:incoming:request', (browserPreRequest) => {
      this.logIncomingRequest(browserPreRequest)
    })

    Cypress.on('browser:response:received', (browserResponseReceived) => {
      this.updateRequestWithResponse(browserResponseReceived)
    })

    Cypress.on('test:before:run', () => {
      // TODO: end pending logs
      this.proxyRequests = []
      this.unmatchedXhrLogs = []
    })
  }

  /**
   * The `cy.route()` XHR stub functions will log before a proxy log is received, so this queues an XHR log to match a proxy log later.
   */
  addXhrLog (xhrLog: UnmatchedXhrLog) {
    this.unmatchedXhrLogs.push(xhrLog)
  }

  /**
   * Get the proxy log for a `cy.intercept()` interception.
   * `cy.intercept()` interceptions always run after the proxy log is initially received, so this is synchronous.
   */
  getInterceptLog (interception: Interception) {
    const { method, url } = interception.request

    return take(this.unmatchedProxyLogs, (({ browserPreRequest }) => browserPreRequest.url === url && browserPreRequest.method === method))
  }

  private updateRequestWithResponse (responseReceived: BrowserResponseReceived): void {
    const proxyRequest = _.find(this.proxyRequests, ({ preRequest }) => preRequest.requestId === responseReceived.requestId)

    if (!proxyRequest) {
      debug('unmatched responseReceived event %o', responseReceived)

      return
    }

    proxyRequest.responseReceived = responseReceived
    proxyRequest.log.snapshot('response').end()
  }

  /**
   * Create a Cypress.Log for an incoming proxy request.
   */
  private logIncomingRequest (preRequest: BrowserPreRequest): void {
    // if this is an XHR, check to see if it matches an XHR log that is missing a pre-request
    if (preRequest.resourceType === 'xhr') {
      const unmatchedXhrLog = take(this.unmatchedXhrLogs, ({ xhr }) => xhr.url === preRequest.url && xhr.method === preRequest.method)

      if (unmatchedXhrLog) {
        updateXhrLog(unmatchedXhrLog.log, preRequest)

        return
      }
    }

    const proxyRequest: Partial<ProxyRequest> = { preRequest }
    const logConfig = getRequestLogConfig(proxyRequest as Omit<ProxyRequest, 'log'>)

    proxyRequest.log = this.Cypress.log(logConfig).snapshot('request')

    this.proxyRequests.push(proxyRequest as ProxyRequest)
  }
}
