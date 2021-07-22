import { Interception, Route } from '@packages/net-stubbing/lib/types'
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

function getDynamicRequestLogConfig (req: Omit<ProxyRequest, 'log'>): Partial<Cypress.LogConfig> {
  const lastInterception = _.last(req.displayInterceptions)
  const alias = lastInterception ? lastInterception.alias : undefined

  return {
    alias,
    aliasType: alias ? 'route' : undefined,
  }
}

function getRequestLogConfig (req: Omit<ProxyRequest, 'log'>): Partial<Cypress.LogConfig> {
  return {
    ...getDynamicRequestLogConfig(req),
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

      if (req.interceptions.length) {
        consoleProps['Matched `cy.intercept()`s'] = req.interceptions
      }

      if (req.xhr) {
        consoleProps['Matched XMLHttpRequest'] = req.xhr
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

      function getStatus (): string | undefined {
        const { spied, stubbed, reqModified, resModified } = req.flags

        if (stubbed) return 'stubbed'

        if (reqModified || resModified) {
          return [
            reqModified && 'req',
            reqModified && resModified && '+',
            resModified && 'res',
            'modified',
          ].filter((v) => v).join(' ')
        }

        if (spied) return 'spied'

        return
      }

      const message = _.compact([
        req.preRequest.method,
        req.responseReceived && req.responseReceived.status,
        getDisplayUrl(req.preRequest.url),
      ]).join(' ')

      return {
        indicator: getIndicator(),
        message,
        interceptions: req.displayInterceptions,
        status: getStatus(),
      }
    },
  }
}

function shouldLog (preRequest: BrowserPreRequest) {
  return ['xhr', 'fetch'].includes(preRequest.resourceType)
}

class ProxyRequest {
  log?: Cypress.Log
  preRequest: BrowserPreRequest
  responseReceived?: BrowserResponseReceived
  xhr?: Cypress.WaitXHR
  interceptions: Array<Interception> = []
  displayInterceptions: Array<{ command: 'intercept' | 'route', alias?: string, type: 'stub' | 'spy' | 'function' }> = []
  flags: {
    spied?: boolean
    stubbed?: boolean
    reqModified?: boolean
    resModified?: boolean
  } = {}

  constructor (preRequest: BrowserPreRequest, opts?: Partial<ProxyRequest>) {
    this.preRequest = preRequest
    opts && _.assign(this, opts)
  }

  setFlag = (flag: keyof ProxyRequest['flags']) => {
    this.flags[flag] = true
    this.log?.set({})
  }
}

type UnmatchedXhrLog = {
  xhr: Cypress.WaitXHR
  route?: any
  log: Cypress.Log
}

export class ProxyLogging {
  unloggedPreRequests: Array<BrowserPreRequest> = []
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
      for (const proxyRequest of this.proxyRequests) {
        if (!proxyRequest.responseReceived && proxyRequest.log) {
          proxyRequest.log.end()
        }
      }
      this.unloggedPreRequests = []
      this.proxyRequests = []
      this.unmatchedXhrLogs = []
    })
  }

  /**
   * The `cy.route()` XHR stub functions will log before a proxy log is received, so this queues an XHR log to be overridden by a proxy log later.
   */
  addXhrLog (xhrLog: UnmatchedXhrLog) {
    this.unmatchedXhrLogs.push(xhrLog)
  }

  /**
   * Update an existing proxy log with an interception, or create a new log if one was not created (like if shouldLog returned false)
   */
  logInterception (interception: Interception, route: Route): ProxyRequest {
    const unloggedPreRequest = take(this.unloggedPreRequests, ({ requestId }) => requestId === interception.browserRequestId)

    if (unloggedPreRequest) {
      debug('interception matched an unlogged prerequest, logging %o', { unloggedPreRequest, interception })
      this.createProxyRequestLog(unloggedPreRequest)
    }

    const proxyRequest = _.find(this.proxyRequests, ({ preRequest }) => preRequest.requestId === interception.browserRequestId)

    if (!proxyRequest) throw new Error('??')

    proxyRequest.interceptions.push(interception)
    proxyRequest.displayInterceptions.push({
      command: 'intercept',
      alias: route.alias,
      type: route.handler ? (_.isFunction(route.handler) ? 'function' : 'stub') : 'spy',
    })

    proxyRequest.log?.set(getDynamicRequestLogConfig(proxyRequest))

    // consider a function to be 'spying' until it actually stubs/modifies the response
    proxyRequest.setFlag(route.handler && !_.isFunction(route.handler) ? 'stubbed' : 'spied')

    return proxyRequest
  }

  private updateRequestWithResponse (responseReceived: BrowserResponseReceived): void {
    const proxyRequest = _.find(this.proxyRequests, ({ preRequest }) => preRequest.requestId === responseReceived.requestId)

    if (!proxyRequest) {
      return debug('unmatched responseReceived event %o', responseReceived)
    }

    proxyRequest.responseReceived = responseReceived
    proxyRequest.log?.snapshot('response').end()
  }

  /**
   * Create a Cypress.Log for an incoming proxy request, or store the metadata for later if it is ignored.
   */
  private logIncomingRequest (preRequest: BrowserPreRequest): void {
    // if this is an XHR, check to see if it matches an XHR log that is missing a pre-request
    if (preRequest.resourceType === 'xhr') {
      const unmatchedXhrLog = take(this.unmatchedXhrLogs, ({ xhr }) => xhr.url === preRequest.url && xhr.method === preRequest.method)

      if (unmatchedXhrLog) {
        const { log, xhr, route } = unmatchedXhrLog
        const proxyRequest = new ProxyRequest(preRequest, {
          xhr,
          log,
          displayInterceptions: route ? [{
            command: 'route',
            alias: route?.alias,
            type: route?.response ? 'stub' : 'spy',
          }] : [],
        })

        proxyRequest.setFlag(route?.response ? 'stubbed' : 'spied')

        log.set(getRequestLogConfig(proxyRequest))

        this.proxyRequests.push(proxyRequest)

        return
      }
    }

    if (!shouldLog(preRequest)) {
      this.unloggedPreRequests.push(preRequest)

      return
    }

    this.createProxyRequestLog(preRequest)
  }

  private createProxyRequestLog (preRequest: BrowserPreRequest) {
    const proxyRequest = new ProxyRequest(preRequest)
    const logConfig = getRequestLogConfig(proxyRequest as Omit<ProxyRequest, 'log'>)

    proxyRequest.log = this.Cypress.log(logConfig).snapshot('request')

    this.proxyRequests.push(proxyRequest as ProxyRequest)
  }
}
