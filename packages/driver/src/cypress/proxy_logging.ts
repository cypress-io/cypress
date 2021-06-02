import { Interception } from '@packages/net-stubbing/lib/types'

const getDisplayUrl = (url: string) => {
  if (url.startsWith(window.location.origin)) {
    return url.slice(window.location.origin.length)
  }

  return url
}

function getRequestLogConfig (data): Partial<Cypress.LogConfig> {
  return {
    name: 'xhr',
    displayName: data.resourceType,
    type: 'parent',
    event: true,
    method: data.method,
    consoleProps: () => {
      return {
        Method: data.method,
        URL: data.url,
      }
    },
    renderProps: () => {
      return {
        indicator: 'successful',
        message: `${data.method} ${getDisplayUrl(data.url)}`,
      }
    },
  }
}

type UnmatchedLog = {
  data: any
  log: Cypress.Log
}

export class ProxyLogging {
  unmatchedLogs: Array<UnmatchedLog> = []

  constructor (private Cypress: Cypress.Cypress) {
    Cypress.on('proxy:incoming:request', (data) => {
      this.logProxyIncomingRequest(data)
    })
  }

  getXhrLog (xhr) {
    const { method, url } = xhr

    return this.takeUnmatchedLog((log) => log.data.url === url && log.data.method === method)
  }

  getInterceptLog (interception: Interception) {
    const { method, url } = interception.request

    return this.takeUnmatchedLog((log) => log.data.url === url && log.data.method === method)
  }

  private logProxyIncomingRequest (data) {
    const log = this.Cypress.log(getRequestLogConfig(data))

    log.end()
    this.unmatchedLogs.push({ data, log })
  }

  private takeUnmatchedLog (filterFn: (unmatchedLog: UnmatchedLog) => boolean): UnmatchedLog {
    for (const i in this.unmatchedLogs) {
      const unmatchedLog = this.unmatchedLogs[i]

      if (!filterFn(unmatchedLog)) continue

      this.unmatchedLogs.splice(i as unknown as number, 1)

      return unmatchedLog
    }
    throw new Error('unmatched log')
  }
}
