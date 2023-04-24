import debugModule from 'debug'
import http from 'http'
import https from 'https'
import _ from 'lodash'
import net from 'net'
import { getProxyForUrl } from 'proxy-from-env'
import url from 'url'
import { createRetryingSocket, getAddress } from './connect'
import { lenientOptions } from './http-utils'
import { ClientCertificateStore } from './client-certificates'
import { CaOptions, getCaOptions } from './ca'

const debug = debugModule('cypress:network:agent')
const CRLF = '\r\n'
const statusCodeRe = /^HTTP\/1.[01] (\d*)/

let baseCaOptions: CaOptions | undefined
const getCaOptionsPromise = (): Promise<CaOptions> => {
  return getCaOptions()
  .then((options: CaOptions) => {
    baseCaOptions = options

    return options
  })
  .catch(() => {
    // Errors reading the config are treated as warnings by npm and node and handled by those processes separately
    // from what we're doing here.
    return {}
  })
}
let baseCaOptionsPromise: Promise<CaOptions> = getCaOptionsPromise()

// This is for testing purposes only
export const _resetBaseCaOptionsPromise = () => {
  baseCaOptions = undefined
  baseCaOptionsPromise = getCaOptionsPromise()
}

const mergeCAOptions = (options: https.RequestOptions, caOptions: CaOptions): https.RequestOptions => {
  if (!caOptions.ca) {
    return options
  }

  if (!options.ca) {
    return {
      ...options,
      ca: caOptions.ca,
    }
  }

  // First, normalize the options.ca option. It can be a string, a Buffer, an array of strings, or an array of Buffers
  const caArray = _.castArray(options.ca).map((caOption) => caOption.toString())

  return {
    ...options,
    ca: [...caArray, ...caOptions.ca],
  }
}

export const clientCertificateStore = new ClientCertificateStore()

type WithProxyOpts<RequestOptions> = RequestOptions & {
  proxy: string
  shouldRetry?: boolean
}

type RequestOptionsWithProxy = WithProxyOpts<http.RequestOptions>

type HttpsRequestOptions = https.RequestOptions & {
  minVersion?: 'TLSv1'
}

type HttpsRequestOptionsWithProxy = WithProxyOpts<HttpsRequestOptions>

type FamilyCache = {
  [host: string]: 4 | 6
}

export function buildConnectReqHead (hostname: string, port: string, proxy: url.Url) {
  const connectReq = [`CONNECT ${hostname}:${port} HTTP/1.1`]

  connectReq.push(`Host: ${hostname}:${port}`)

  if (proxy.auth) {
    connectReq.push(`Proxy-Authorization: Basic ${Buffer.from(proxy.auth).toString('base64')}`)
  }

  return connectReq.join(CRLF) + _.repeat(CRLF, 2)
}

interface CreateProxySockOpts {
  proxy: url.Url
  shouldRetry?: boolean
}

type CreateProxySockCb = (
  (err: undefined, result: net.Socket, triggerRetry: (err: Error) => void) => void
) & (
  (err: Error) => void
)

export const createProxySock = (opts: CreateProxySockOpts, cb: CreateProxySockCb) => {
  if (opts.proxy.protocol !== 'https:' && opts.proxy.protocol !== 'http:') {
    return cb(new Error(`Unsupported proxy protocol: ${opts.proxy.protocol}`))
  }

  const isHttps = opts.proxy.protocol === 'https:'
  const port = opts.proxy.port || (isHttps ? 443 : 80)

  let connectOpts: any = {
    port: Number(port),
    host: opts.proxy.hostname,
    useTls: isHttps,
  }

  if (!opts.shouldRetry) {
    connectOpts.getDelayMsForRetry = () => undefined
  }

  createRetryingSocket(connectOpts, (err, sock, triggerRetry) => {
    if (err) {
      return cb(err)
    }

    cb(undefined, <net.Socket>sock, <CreateProxySockCb>triggerRetry)
  })
}

export const isRequestHttps = (options: http.RequestOptions) => {
  // WSS connections will not have an href, but you can tell protocol from the defaultAgent
  return _.get(options, '_defaultAgent.protocol') === 'https:' || (options.href || '').slice(0, 6) === 'https'
}

export const isResponseStatusCode200 = (head: string) => {
  // read status code from proxy's response
  const matches = head.match(statusCodeRe)

  return _.get(matches, 1) === '200'
}

export const regenerateRequestHead = (req: http.ClientRequest) => {
  delete req._header
  req._implicitHeader()
  if (req.output && req.output.length > 0) {
    // the _header has already been queued to be written to the socket
    const first = req.output[0]
    const endOfHeaders = first.indexOf(_.repeat(CRLF, 2)) + 4

    req.output[0] = req._header + first.substring(endOfHeaders)
  }
}

const getFirstWorkingFamily = (
  { port, host }: http.RequestOptions,
  familyCache: FamilyCache,
  cb: Function,
) => {
  // this is a workaround for localhost (and potentially others) having invalid
  // A records but valid AAAA records. here, we just cache the family of the first
  // returned A/AAAA record for a host that we can establish a connection to.
  // https://github.com/cypress-io/cypress/issues/112

  const isIP = net.isIP(host)

  if (isIP) {
    // isIP conveniently returns the family of the address
    return cb(isIP)
  }

  if (process.env.HTTP_PROXY) {
    // can't make direct connections through the proxy, this won't work
    return cb()
  }

  if (familyCache[host]) {
    return cb(familyCache[host])
  }

  return getAddress(port, host)
  .then((firstWorkingAddress: net.Address) => {
    familyCache[host] = firstWorkingAddress.family

    return cb(firstWorkingAddress.family)
  })
  .catch(() => {
    return cb()
  })
}

export class CombinedAgent {
  httpAgent: HttpAgent
  httpsAgent: HttpsAgent
  familyCache: FamilyCache = {}

  constructor (httpOpts: http.AgentOptions = {}, httpsOpts: https.AgentOptions = {}) {
    this.httpAgent = new HttpAgent(httpOpts)
    this.httpsAgent = new HttpsAgent(httpsOpts)
  }

  // called by Node.js whenever a new request is made internally
  addRequest (req: http.ClientRequest, options: http.RequestOptions, port?: number, localAddress?: string) {
    _.merge(req, lenientOptions)

    // Legacy API: addRequest(req, host, port, localAddress)
    // https://github.com/nodejs/node/blob/cb68c04ce1bc4534b2d92bc7319c6ff6dda0180d/lib/_http_agent.js#L148-L155
    if (typeof options === 'string') {
      // @ts-ignore
      options = {
        host: options,
        port: port!,
        localAddress,
      }
    }

    const isHttps = isRequestHttps(options)

    if (!options.href) {
      // options.path can contain query parameters, which url.format will not-so-kindly urlencode for us...
      // so just append it to the resultant URL string
      options.href = url.format({
        protocol: isHttps ? 'https:' : 'http:',
        slashes: true,
        hostname: options.host,
        port: options.port,
      }) + options.path
    }

    if (!options.uri) {
      options.uri = url.parse(options.href)
    }

    debug('addRequest called %o', { isHttps, ..._.pick(options, 'href') })

    return getFirstWorkingFamily(options, this.familyCache, (family: net.family) => {
      options.family = family

      debug('got family %o', _.pick(options, 'family', 'href'))

      if (isHttps) {
        _.assign(options, clientCertificateStore.getClientCertificateAgentOptionsForUrl(options.uri))

        return this.httpsAgent.addRequest(req, options as https.RequestOptions)
      }

      this.httpAgent.addRequest(req, options)
    })
  }
}

const getProxyOrTargetOverrideForUrl = (href) => {
  // HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS is used for Cypress in Cypress E2E testing and will
  // force the parent Cypress server to treat the child Cypress server like a proxy without
  // having HTTP_PROXY set and will force traffic ONLY bound to that origin to behave
  // like a proxy
  const targetHost = process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS

  if (targetHost && href.includes(targetHost)) {
    return targetHost
  }

  return getProxyForUrl(href)
}

class HttpAgent extends http.Agent {
  httpsAgent: https.Agent

  constructor (opts: http.AgentOptions = {}) {
    opts.keepAlive = true
    super(opts)
    // we will need this if they wish to make http requests over an https proxy
    this.httpsAgent = new https.Agent({ keepAlive: true })
  }

  addRequest (req: http.ClientRequest, options: http.RequestOptions) {
    if (process.env.HTTP_PROXY || process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS) {
      const proxy = getProxyOrTargetOverrideForUrl(options.href)

      if (proxy) {
        options.proxy = proxy

        return this._addProxiedRequest(req, <RequestOptionsWithProxy>options)
      }
    }

    super.addRequest(req, options)
  }

  _addProxiedRequest (req: http.ClientRequest, options: RequestOptionsWithProxy) {
    debug(`Creating proxied request for ${options.href} through ${options.proxy}`)

    const proxy = url.parse(options.proxy)

    // set req.path to the full path so the proxy can resolve it
    // @ts-ignore: Cannot assign to 'path' because it is a constant or a read-only property.
    req.path = options.href

    delete req._header // so we can set headers again

    req.setHeader('host', `${options.host}:${options.port}`)
    if (proxy.auth) {
      req.setHeader('proxy-authorization', `basic ${Buffer.from(proxy.auth).toString('base64')}`)
    }

    // node has queued an HTTP message to be sent already, so we need to regenerate the
    // queued message with the new path and headers
    // https://github.com/TooTallNate/node-http-proxy-agent/blob/master/index.js#L93
    regenerateRequestHead(req)

    options.port = Number(proxy.port || 80)
    options.host = proxy.hostname || 'localhost'
    delete options.path // so the underlying net.connect doesn't default to IPC

    if (proxy.protocol === 'https:') {
      // gonna have to use the https module to reach the proxy, even though this is an http req
      req.agent = this.httpsAgent

      return this.httpsAgent.addRequest(req, options)
    }

    super.addRequest(req, options)
  }
}

class HttpsAgent extends https.Agent {
  constructor (opts: https.AgentOptions = {}) {
    opts.keepAlive = true
    super(opts)
  }

  addRequest (req: http.ClientRequest, options: https.RequestOptions) {
    // Ensure we have a proper port defined otherwise node has assumed we are port 80
    // (https://github.com/nodejs/node/blob/master/lib/_http_client.js#L164) since we are a combined agent
    // rather than an http or https agent. This will cause issues with fetch requests (@cypress/request already handles it:
    // https://github.com/cypress-io/request/blob/master/request.js#L301-L303)
    if (!options.uri.port && options.uri.protocol === 'https:') {
      options.uri.port = String(443)
      options.port = 443
    }

    if (baseCaOptions) {
      super.addRequest(req, mergeCAOptions(options, baseCaOptions))
    } else {
      baseCaOptionsPromise.then((caOptions) => {
        super.addRequest(req, mergeCAOptions(options, caOptions))
      })
    }
  }

  createConnection (options: HttpsRequestOptions, cb: http.SocketCallback) {
    if (process.env.HTTPS_PROXY) {
      const proxy = getProxyForUrl(options.href)

      if (proxy) {
        options.proxy = <string>proxy

        return this.createUpstreamProxyConnection(<HttpsRequestOptionsWithProxy>options, cb)
      }
    }

    // @ts-ignore
    cb(null, super.createConnection(options))
  }

  createUpstreamProxyConnection (options: HttpsRequestOptionsWithProxy, cb: http.SocketCallback) {
    // heavily inspired by
    // https://github.com/mknj/node-keepalive-proxy-agent/blob/master/index.js
    debug(`Creating proxied socket for ${options.href} through ${options.proxy}`)

    const proxy = url.parse(options.proxy)
    const port = options.uri.port || '443'
    const hostname = options.uri.hostname || 'localhost'

    createProxySock({ proxy, shouldRetry: options.shouldRetry }, (originalErr?, proxySocket?, triggerRetry?) => {
      if (originalErr) {
        const err: any = new Error(`A connection to the upstream proxy could not be established: ${originalErr.message}`)

        err.originalErr = originalErr
        err.upstreamProxyConnect = true

        return cb(err, undefined)
      }

      const onClose = () => {
        triggerRetry(new Error('ERR_EMPTY_RESPONSE: The upstream proxy closed the socket after connecting but before sending a response.'))
      }

      const onError = (err: Error) => {
        triggerRetry(err)
        proxySocket.destroy()
      }

      let buffer = ''

      const onData = (data: Buffer) => {
        debug(`Proxy socket for ${options.href} established`)

        buffer += data.toString()

        if (!_.includes(buffer, _.repeat(CRLF, 2))) {
          // haven't received end of headers yet, keep buffering
          proxySocket.once('data', onData)

          return
        }

        // we've now gotten enough of a response not to retry
        // connecting to the proxy
        proxySocket.removeListener('error', onError)
        proxySocket.removeListener('close', onClose)

        if (!isResponseStatusCode200(buffer)) {
          return cb(new Error(`Error establishing proxy connection. Response from server was: ${buffer}`), undefined)
        }

        if (options._agentKey) {
          // https.Agent will upgrade and reuse this socket now
          options.socket = proxySocket

          // as of Node 12, a ServerName cannot be an IP address
          // https://github.com/cypress-io/cypress/issues/5729
          if (!net.isIP(hostname)) {
            options.servername = hostname
          }

          return cb(undefined, super.createConnection(options, undefined))
        }

        cb(undefined, proxySocket)
      }

      proxySocket.once('close', onClose)
      proxySocket.once('error', onError)
      proxySocket.once('data', onData)

      const connectReq = buildConnectReqHead(hostname, port, proxy)

      proxySocket.setNoDelay(true)
      proxySocket.write(connectReq)
    })
  }
}

const agent = new CombinedAgent()

export default agent
