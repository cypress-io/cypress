import * as http from 'http'
import * as https from 'http'
import * as net from 'net'
import * as tls from 'tls'
import * as url from 'url'
import { getProxyForUrl } from 'proxy-from-env'

const outHeadersKey = Symbol.for('outHeadersKey')

function createProxySock (proxy: url.Url) {
  if (proxy.protocol === 'http:') {
    return net.connect(Number(proxy.port) || 80, proxy.hostname)
  }

  if (proxy.protocol === 'https:') {
    // if the upstream is https, we need to wrap the socket with tls
    return tls.connect(Number(proxy.port) || 443, proxy.hostname)
  }

  // socksv5, etc...
  throw new Error(`Unsupported proxy protocol: ${proxy.protocol}`)
}

// bypasses the "request already sent?" check
// https://github.com/nodejs/node/blob/v8.x/lib/_http_outgoing.js#L497
function setHeaderInternal (req: http.ClientRequest, name: string, value: string) {
  if (!req[outHeadersKey]) {
    req[outHeadersKey] = {}
  }

  req[outHeadersKey][name.toLowerCase()] = [name, value]
}

// some data is already queued, regenerate it
// https://github.com/TooTallNate/node-http-proxy-agent/blob/b7b7cc793c3226aa83f820ce5c277e81862d32eb/index.js#L93
function regenerateQueuedRequestBuffer (req: http.ClientRequest) {
  if (req._header) {
    req._header = null;
    req._implicitHeader();
    if (req.output && req.output.length > 0) {
      // the _header has already been queued to be written to the socket
      var first = req.output[0];
      var endOfHeaders = first.indexOf('\r\n\r\n') + 4;
      req.output[0] = req._header + first.substring(endOfHeaders);
    }
  }
}

class CombinedAgent {
  httpAgent: HttpAgent
  httpsAgent: HttpsAgent

  constructor(httpOpts: http.AgentOptions = {}, httpsOpts: https.AgentOptions = {}) {
    this.httpAgent = new HttpAgent(httpOpts)
    this.httpsAgent = new HttpsAgent(httpsOpts)
  }

  // called by Node.js whenever a new request is made internally
  addRequest(req, options) {
    if (options.uri.protocol === 'https:') {
      return this.httpsAgent.addRequest(req, options)
    }

    if (options.uri.protocol === 'http:') {
      return this.httpAgent.addRequest(req, options)
    }

    throw new Error(`Unsupported protocol for CombinedAgent: ${options.uri.protocol}`)
  }
}

class HttpAgent extends http.Agent {
  httpsAgent: https.Agent

  constructor (opts: http.AgentOptions = {}) {
    opts.keepAlive = true
    super(opts)
    // we will need this if they wish to make http requests over an https proxy
    this.httpsAgent = new https.Agent({ keepAlive: true })
  }

  createSocket (req, options, cb) {
    if (process.env.HTTP_PROXY) {
      const proxy = getProxyForUrl(options.href)

      if (proxy) {
        options.proxy = proxy

        return this._createProxiedSocket(req, options, cb)
      }
    }

    super.createSocket(req, options, cb)
  }

  _createProxiedSocket (req, options, cb) {
    const proxy = url.parse(options.proxy)

    // set req.path to the full path so the proxy can resolve it
    req.path = options.href

    setHeaderInternal(req, 'host', `${options.host}:${options.port}`)
    if (proxy.auth) {
      setHeaderInternal(req, 'proxy-authorization', `basic ${Buffer.from(proxy.auth).toString('base64')}`)
    }
    regenerateQueuedRequestBuffer(req)

    options.port = proxy.port || 80
    options.host = proxy.hostname
    delete options.path // so the underlying net.connect doesn't default to IPC

    if (proxy.protocol === 'https:') {
      // gonna have to use the https module instead
      req.agent = this.httpsAgent

      return this.httpsAgent.addRequest(req, options)
    }

    super.createSocket(req, options, cb)
  }
}

class HttpsAgent extends https.Agent {
  constructor (opts: https.AgentOptions = {}) {
    opts.keepAlive = true
    super(opts)
  }

  createConnection (options, cb) {
    if (process.env.HTTPS_PROXY) {
      const proxy = getProxyForUrl(options.href)

      if (proxy) {
        options.proxy = proxy

        return this._createProxiedConnection(options, cb)
      }
    }

    // @ts-ignore
    cb(null, super.createConnection(options))
  }

  // https://github.com/mknj/node-keepalive-proxy-agent/blob/master/index.js
  _createProxiedConnection (options, cb) {
    const proxy = url.parse(options.proxy)

    const proxySocket = createProxySock(proxy)

    const onError = (err) => {
      proxySocket.destroy()
      cb(err)
    }

    proxySocket.once('error', onError)
    proxySocket.once('data', (data) => {
      proxySocket.removeListener('error', onError)
      // read status code from proxy's response
      const matches = data.toString().match(/^HTTP\/1.1 (\d*)/)

      if (matches[1] !== '200') {
        proxySocket.destroy()

        return cb(new Error(`Error establishing proxy connection: ${matches[0]}`))
      }

      // https.Agent will reuse this socket now that we've set it
      options.socket = proxySocket

      // @ts-ignore
      cb(null, super.createConnection(options))
    })

    let connectReq = `CONNECT ${options.uri.hostname}:${options.uri.port} HTTP/1.1\r\n`

    connectReq += `Host: ${options.uri.hostname}:${options.uri.port}\r\n`

    if (proxy.auth) {
      connectReq += `Proxy-Authorization: basic ${Buffer.from(proxy.auth).toString('base64')}\r\n`
    }

    connectReq += '\r\n'
    proxySocket.write(connectReq)
  }
}

module.exports = new CombinedAgent()

module.exports.CombinedAgent = CombinedAgent
