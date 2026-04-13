import type { Interception, Route } from '@packages/net-stubbing/lib/types'
import type { BrowserPreRequest, BrowserResponseReceived, RequestError } from '@packages/proxy/lib/types'
import $errUtils from './error_utils'
import Debug from 'debug'

const debug = Debug('cypress:driver:proxy-logging')

function formatInterception ({ route, interception }: ProxyRequest['interceptions'][number]) {
  const ret = {
    'RouteMatcher': route.options,
    'RouteHandler Type': route.handler != null ? (typeof route.handler === 'function' ? 'Function' : 'StaticResponse stub') : 'Spy',
    'RouteHandler': route.handler,
    'Request': interception.request,
  }

  if (interception.response) {
    const response: Record<string, any> = {}

    for (const [k, v] of Object.entries(interception.response)) {
      if (v != null) response[k] = v
    }

    ret['Response'] = response
  }

  const alias = interception.request.alias || route.alias

  if (alias) ret['Alias'] = alias

  return ret
}

function getDisplayUrl (url: string) {
  if (url.startsWith(window.location.origin)) {
    return url.slice(window.location.origin.length)
  }

  return url
}

function getDynamicRequestLogConfig (req: Omit<ProxyRequest, 'log'>): Partial<Cypress.InternalLogConfig> {
  const last = req.interceptions.at(-1)
  let alias = last ? last.interception.request.alias || last.route.alias : undefined

  return {
    alias,
    aliasType: alias ? 'route' : undefined,
  }
}

function getRequestLogConfig (req: Omit<ProxyRequest, 'log'>): Partial<Cypress.InternalLogConfig> {
  function getStatus (): string | undefined {
    const { stubbed, reqModified, resModified } = req.flags

    if (stubbed) return

    if (reqModified && resModified) return 'req + res modified'

    if (reqModified) return 'req modified'

    if (resModified) return 'res modified'

    return
  }

  return {
    ...getDynamicRequestLogConfig(req),
    displayName: req.preRequest.resourceType,
    name: 'request',
    type: 'parent',
    event: true,
    url: req.preRequest.url,
    method: req.preRequest.method,
    timeout: 0,
    message: '', // set to empty string so that we don't inherit the default message
    consoleProps: () => req.consoleProps,
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

      const message = [
        req.preRequest.method,
        req.responseReceived && req.responseReceived.status,
        getDisplayUrl(req.preRequest.url),
      ].filter(Boolean).join(' ')

      return {
        indicator: getIndicator(),
        message,
        status: getStatus(),
        wentToOrigin: !req.flags.stubbed,
        interceptions: [
          ...(req.interceptions.map(({ interception, route }) => {
            return {
              command: 'intercept',
              alias: interception.request.alias || route.alias,
              type: route.handler != null ? (typeof route.handler === 'function' ? 'function' : 'stub') : 'spy',
            }
          })),
          ...(req.route ? [{
            command: 'route',
            alias: req.route?.alias,
            type: req.route?.response == null ? 'spy' : 'stub',
          }] : []),
        ],
      }
    },
  }
}

class ProxyRequest {
  log?: Cypress.Log
  preRequest: BrowserPreRequest
  responseReceived?: BrowserResponseReceived
  error?: Error
  route?: any
  stack?: string
  interceptions: Array<{ interception: Interception, route: Route }> = []
  displayInterceptions: Array<{ command: 'intercept' | 'route', alias?: string, type: 'stub' | 'spy' | 'function' }> = []
  flags: {
    spied?: boolean
    stubbed?: boolean
    reqModified?: boolean
    resModified?: boolean
  } = {}

  // constant reference to consoleProps so changes reach the console
  // @see https://github.com/cypress-io/cypress/issues/17656
  readonly consoleProps: any

  constructor (preRequest: BrowserPreRequest, opts?: Partial<ProxyRequest>) {
    this.preRequest = preRequest
    opts && Object.assign(this, opts)

    // high-level request information
    this.consoleProps = {
      'Resource Type': preRequest.resourceType,
      Method: preRequest.method,
      URL: preRequest.url,
    }

    this.updateConsoleProps()
  }

  updateConsoleProps () {
    const { consoleProps } = this

    consoleProps['Request went to origin?'] = this.flags.stubbed ? 'no (response was stubbed, see below)' : 'yes'

    if (this.flags.reqModified) consoleProps['Request modified?'] = 'yes'

    if (this.flags.resModified) consoleProps['Response modified?'] = 'yes'

    if (this.interceptions.length) {
      if (this.interceptions.length > 1) {
        consoleProps['Matched `cy.intercept()`s'] = this.interceptions.map(formatInterception)
      } else {
        consoleProps['Matched `cy.intercept()`'] = formatInterception(this.interceptions[0])
      }
    }

    if (this.stack) {
      consoleProps['groups'] = () => {
        return [
          {
            name: 'Initiator',
            items: [this.stack],
            label: false,
          },
        ]
      }
    }

    // ensure these fields are always ordered correctly regardless of when they are added
    ['Response Status Code', 'Response Headers', 'Response Body', 'Request Headers', 'Request Body'].forEach((k) => delete consoleProps[k])

    // details on request
    consoleProps['Request Headers'] = this.preRequest.headers

    const lastInterception = this.interceptions.at(-1)
    const reqBody = lastInterception?.interception?.request?.body

    if (reqBody) consoleProps['Request Body'] = reqBody

    if (this.responseReceived) {
      Object.assign(consoleProps, {
        'Response Status Code': this.responseReceived.status,
        'Response Headers': this.responseReceived.headers,
      })
    }

    // details on response
    const resBody = this.interceptions.at(-1)?.interception?.response?.body

    if (resBody) {
      consoleProps['Response Body'] = resBody
    }

    if (this.error) {
      consoleProps['Error'] = this.error
    }
  }

  setFlag = (flag: keyof ProxyRequest['flags']) => {
    this.flags[flag] = true
    this.log?.set({})
  }
}

export default class ProxyLogging {
  proxyRequests: Array<ProxyRequest> = []

  constructor (private Cypress: Cypress.Cypress) {
    Cypress.on('request:event', (eventName, data) => {
      switch (eventName) {
        case 'incoming:request':
          return this.logIncomingRequest(data)
        case 'response:received':
          return this.updateRequestWithResponse(data)
        case 'request:error':
          return this.updateRequestWithError(data)
        default:
          throw new Error(`unrecognized request:event event ${eventName}`)
      }
    })

    Cypress.on('test:before:run', () => {
      for (const proxyRequest of this.proxyRequests) {
        if (!proxyRequest.responseReceived && proxyRequest.log) {
          proxyRequest.log.end()
        }
      }
      this.proxyRequests = []
    })
  }

  /**
   * Update an existing proxy log with an interception, or create a new log if one was not created (like if shouldLog returned false)
   */
  logInterception (interception: Interception, route: Route): ProxyRequest | undefined {
    const proxyRequest = this.proxyRequests.find(({ preRequest }) => preRequest.requestId === interception.browserRequestId)

    if (!proxyRequest) {
      // request was never logged
      return undefined
    }

    proxyRequest.interceptions.push({ interception, route })

    proxyRequest.log?.set(getDynamicRequestLogConfig(proxyRequest))

    // consider a function to be 'spying' until it actually stubs/modifies the response
    proxyRequest.setFlag(route.handler != null && typeof route.handler !== 'function' ? 'stubbed' : 'spied')

    return proxyRequest
  }

  private updateRequestWithResponse (responseReceived: BrowserResponseReceived): void {
    const proxyRequest = this.proxyRequests.find(({ preRequest }) => preRequest.requestId === responseReceived.requestId)

    if (!proxyRequest) {
      return debug('unmatched responseReceived event %o', responseReceived)
    }

    proxyRequest.responseReceived = responseReceived

    proxyRequest.updateConsoleProps()

    // @ts-ignore
    const hasResponseSnapshot = proxyRequest.log?.get('snapshots')?.find((v) => v.name === 'response')

    if (!hasResponseSnapshot) proxyRequest.log?.snapshot('response')

    proxyRequest.log?.end()
  }

  private updateRequestWithError (error: RequestError): void {
    const proxyRequest = this.proxyRequests.find(({ preRequest }) => preRequest.requestId === error.requestId)

    if (!proxyRequest) {
      return debug('unmatched error event %o', error)
    }

    proxyRequest.error = $errUtils.makeErrFromObj(error.error)
    proxyRequest.updateConsoleProps()
    proxyRequest.log?.snapshot('error').error(proxyRequest.error)
  }

  /**
   * Create a Cypress.Log for an incoming proxy request.
   */
  private logIncomingRequest (browserPreRequest: BrowserPreRequest): void {
    this.createProxyRequestLog(browserPreRequest)
  }

  private createProxyRequestLog (preRequest: BrowserPreRequest): ProxyRequest {
    const proxyRequest = new ProxyRequest(preRequest)
    const logConfig = getRequestLogConfig(proxyRequest as Omit<ProxyRequest, 'log'>)

    // TODO: Figure out what is causing the race condition here
    //       Follow up on latest log regression fix to see if this is resolved.
    if (this.Cypress.log) {
      proxyRequest.log = this.Cypress.log(logConfig)?.snapshot('request')
    }

    this.proxyRequests.push(proxyRequest as ProxyRequest)

    return proxyRequest
  }
}
