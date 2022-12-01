import _ from 'lodash'
import type { Interception, Route } from '@packages/net-stubbing/lib/types'
import type { BrowserPreRequest, BrowserResponseReceived, RequestError } from '@packages/proxy/lib/types'
import $errUtils from './error_utils'
import Debug from 'debug'

const debug = Debug('cypress:driver:network-logs')

function formatInterception ({ route, interception }: RequestLog['interceptions'][number]) {
  const ret = {
    'RouteMatcher': route.options,
    'RouteHandler Type': !_.isNil(route.handler) ? (_.isFunction(route.handler) ? 'Function' : 'StaticResponse stub') : 'Spy',
    'RouteHandler': route.handler,
    'Request': interception.request,
  }

  if (interception.response) {
    ret['Response'] = _.omitBy(interception.response, _.isNil)
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

function getDynamicRequestLogConfig (req: Omit<RequestLog, 'log'>): Partial<Cypress.InternalLogConfig> {
  const last = _.last(req.interceptions)
  let alias = last ? last.interception.request.alias || last.route.alias : undefined

  return {
    alias,
    aliasType: alias ? 'route' : undefined,
  }
}

function getRequestLogConfig (req: Omit<RequestLog, 'log'>): Partial<Cypress.InternalLogConfig> {
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

      const message = _.compact([
        req.preRequest.method,
        req.responseReceived && req.responseReceived.status,
        getDisplayUrl(req.preRequest.url),
      ]).join(' ')

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
              type: !_.isNil(route.handler) ? (_.isFunction(route.handler) ? 'function' : 'stub') : 'spy',
            }
          })),
          ...(req.route ? [{
            command: 'route',
            alias: req.route?.alias,
            type: _.isNil(req.route?.response) ? 'spy' : 'stub',
          }] : []),
        ],
      }
    },
  }
}

class RequestLog {
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

  constructor (preRequest: BrowserPreRequest, opts?: Partial<RequestLog>) {
    this.preRequest = preRequest
    opts && _.assign(this, opts)

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

    const reqBody = _.chain(this.interceptions).last().get('interception.request.body').value()

    if (reqBody) consoleProps['Request Body'] = reqBody

    if (this.responseReceived) {
      _.assign(consoleProps, {
        'Response Status Code': this.responseReceived.status,
        'Response Headers': this.responseReceived.headers,
      })
    }

    // details on response
    let resBody

    if ((resBody = _.chain(this.interceptions).last().get('interception.response.body').value())) {
      consoleProps['Response Body'] = resBody
    }

    if (this.error) {
      consoleProps['Error'] = this.error
    }
  }

  setFlag = (flag: keyof RequestLog['flags']) => {
    this.flags[flag] = true
    this.log?.set({})
  }
}

type FilterFnOpts = BrowserPreRequest & { matchedIntercept: boolean }

export default class NetworkLogs {
  private proxyRequests: Array<RequestLog> = []

  // public API properties:
  public showAllIntercepts = true
  public showAllXhrFetch = true
  // set via `filter` setter
  private _filter: ((requestInfo: FilterFnOpts) => boolean) | undefined

  constructor (private Cypress: Cypress.Cypress) {
    Cypress.on('request:event', (eventName, data) => {
      switch (eventName) {
        case 'incoming:request':
          return this.createProxyRequestLog(data)
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

  set filter (filterFn: typeof this._filter | undefined) {
    if (filterFn !== undefined && typeof filterFn !== 'function') {
      $errUtils.throwErrByPath('network_logs.filter_must_be_function', { args: { filterFn } })
    }

    this._filter = filterFn
  }

  get filter () {
    return this._filter
  }

  /**
   * Returns a setter which can be used to update the request's log as `cy.intercept()` rules run.
   */
  getFlagSetter (interception: Interception, route: Route): RequestLog['setFlag'] {
    let proxyRequest = _.find(this.proxyRequests, ({ preRequest }) => preRequest.requestId === interception.browserRequestId)

    if (!proxyRequest) {
      // a custom `.filter` can cause the proxyRequest to not exist, so just return a no-op
      debug('Missing proxyRequest in logInterception %o', { interception, route })

      return () => {}
    }

    proxyRequest.interceptions.push({ interception, route })

    proxyRequest.log?.set(getDynamicRequestLogConfig(proxyRequest))

    return proxyRequest.setFlag
  }

  private updateRequestWithResponse (responseReceived: BrowserResponseReceived): void {
    const proxyRequest = _.find(this.proxyRequests, ({ preRequest }) => preRequest.requestId === responseReceived.requestId)

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
    const proxyRequest = _.find(this.proxyRequests, ({ preRequest }) => preRequest.requestId === error.requestId)

    if (!proxyRequest) {
      return debug('unmatched error event %o', error)
    }

    proxyRequest.error = $errUtils.makeErrFromObj(error.error)
    proxyRequest.updateConsoleProps()
    proxyRequest.log?.snapshot('error').error(proxyRequest.error)
  }

  private shouldDisplay (requestInfo: FilterFnOpts) {
    return (
      (this.showAllXhrFetch && ['xhr', 'fetch'].includes(requestInfo.resourceType))
      || (this.showAllIntercepts && requestInfo.matchedIntercept)
      || (this._filter?.(requestInfo))
    )
  }

  private createProxyRequestLog ({ browserPreRequest, matchedIntercept }: { browserPreRequest: BrowserPreRequest, matchedIntercept: boolean }): RequestLog | undefined {
    if (!this.shouldDisplay({ ...browserPreRequest, matchedIntercept })) {
      return
    }

    const proxyRequest = new RequestLog(browserPreRequest)
    const logConfig = getRequestLogConfig(proxyRequest as Omit<RequestLog, 'log'>)

    // TODO: Figure out what is causing the race condition here
    //       Follow up on latest log regression fix to see if this is resolved.
    if (this.Cypress.log) {
      proxyRequest.log = this.Cypress.log(logConfig)?.snapshot('request')
    }

    this.proxyRequests.push(proxyRequest as RequestLog)

    return proxyRequest
  }
}
