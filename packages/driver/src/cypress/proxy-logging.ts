import { Interception } from '@packages/net-stubbing/lib/types'
import { BrowserPreRequest } from '@packages/proxy/lib/types'

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

type UnmatchedLog = {
  browserPreRequest: BrowserPreRequest
  log: Cypress.Log
}

export class ProxyLogging {
  unmatchedLogs: Array<UnmatchedLog> = []

  constructor (private Cypress: Cypress.Cypress) {
    Cypress.on('proxy:incoming:request', (browserPreRequest) => {
      this.logProxyIncomingRequest(browserPreRequest)
    })
  }

  getXhrLog (xhr) {
    const { method, url } = xhr

    return this.takeUnmatchedLog(({ browserPreRequest }) => browserPreRequest.url === url && browserPreRequest.method === method)
  }

  getInterceptLog (interception: Interception) {
    const { method, url } = interception.request

    return this.takeUnmatchedLog(({ browserPreRequest }) => browserPreRequest.url === url && browserPreRequest.method === method)
  }

  private logProxyIncomingRequest (browserPreRequest) {
    const log = this.Cypress.log(getRequestLogConfig(browserPreRequest))

    log.end()
    this.unmatchedLogs.push({ browserPreRequest, log })
  }

  private takeUnmatchedLog (filterFn: (unmatchedLog: UnmatchedLog) => boolean): Cypress.Log | undefined {
    for (const i in this.unmatchedLogs) {
      const unmatchedLog = this.unmatchedLogs[i]

      if (!filterFn(unmatchedLog)) continue

      this.unmatchedLogs.splice(i as unknown as number, 1)

      return unmatchedLog.log
    }

    return
  }
}
