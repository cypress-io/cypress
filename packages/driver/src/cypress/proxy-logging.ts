import { Interception } from '@packages/net-stubbing/lib/types'
import { BrowserPreRequest } from '@packages/proxy/lib/types'

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

function getRequestLogConfig (browserPreRequest: BrowserPreRequest): Partial<Cypress.LogConfig> {
  return {
    name: 'xhr',
    displayName: browserPreRequest.resourceType,
    type: 'parent',
    event: true,
    url: browserPreRequest.url,
    method: browserPreRequest.method,
    consoleProps: () => {
      return {
        Method: browserPreRequest.method,
        URL: browserPreRequest.url,
      }
    },
    renderProps: () => {
      return {
        indicator: 'successful',
        message: `${browserPreRequest.method} ${getDisplayUrl(browserPreRequest.url)}`,
      }
    },
    browserPreRequest,
  }
}

function updateXhrLog (log: Cypress.Log, browserPreRequest: BrowserPreRequest) {
  log.set({ browserPreRequest })
}

type UnmatchedProxyLog = {
  browserPreRequest: BrowserPreRequest
  log: Cypress.Log
}

type UnmatchedXhrLog = {
  xhr: Cypress.WaitXHR
  log: Cypress.Log
}

export class ProxyLogging {
  unmatchedProxyLogs: Array<UnmatchedProxyLog> = []
  unmatchedXhrLogs: Array<UnmatchedXhrLog> = []

  constructor (private Cypress: Cypress.Cypress) {
    Cypress.on('proxy:incoming:request', (browserPreRequest) => {
      this.logProxyIncomingRequest(browserPreRequest)
    })
  }

  addXhrLog (xhrLog: UnmatchedXhrLog) {
    this.unmatchedXhrLogs.push(xhrLog)
  }

  getInterceptLog (interception: Interception) {
    const { method, url } = interception.request

    return take(this.unmatchedProxyLogs, (({ browserPreRequest }) => browserPreRequest.url === url && browserPreRequest.method === method))
  }

  private logProxyIncomingRequest (browserPreRequest: BrowserPreRequest): void {
    // if this is an XHR, check to see if it matches an XHR log that is missing a pre-request
    if (browserPreRequest.resourceType === 'xhr') {
      const unmatchedXhrLog = take(this.unmatchedXhrLogs, ({ xhr }) => xhr.url === browserPreRequest.url && xhr.method === browserPreRequest.method)

      if (unmatchedXhrLog) {
        updateXhrLog(unmatchedXhrLog.log, browserPreRequest)

        return
      }
    }

    const log = this.Cypress.log(getRequestLogConfig(browserPreRequest))

    log.end()
    this.unmatchedProxyLogs.push({ browserPreRequest, log })
  }
}
