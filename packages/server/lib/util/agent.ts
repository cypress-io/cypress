import * as http from 'http'
import * as https from 'https'
import * as net from 'net'
import * as tls from 'tls'
import * as url from 'url'
import { getProxyForUrl } from 'proxy-from-env'

function createProxySock (proxy: url.Url) {
  if (proxy.protocol === 'http:') {
    return net.connect(Number(proxy.port || 80), proxy.hostname)
  }

  if (proxy.protocol === 'https:') {
    // if the upstream is https, we need to wrap the socket with tls
    return tls.connect(Number(proxy.port || 443), proxy.hostname)
  }

  // socksv5, etc...
  throw new Error(`Unsupported proxy protocol: ${proxy.protocol}`)
}

function regenerateRequestHead(req) {
  req._header = null;
  req._implicitHeader();
  if (req.output && req.output.length > 0) {
    // the _header has already been queued to be written to the socket
    var first = req.output[0];
    var endOfHeaders = first.indexOf('\r\n\r\n') + 4;
    req.output[0] = req._header + first.substring(endOfHeaders);
  }
}

export class CombinedAgent {
  httpAgent: HttpAgent
  httpsAgent: HttpsAgent

  constructor(httpOpts: http.AgentOptions = {}, httpsOpts: https.AgentOptions = {}) {
    this.httpAgent = new HttpAgent(httpOpts)
    this.httpsAgent = new HttpsAgent(httpsOpts)
  }

  // called by Node.js whenever a new request is made internally
  addRequest(req: http.ClientRequest, options: any) {
    // WSS connections will not have an href, but you can tell protocol from the defaultAgent
    const isHttps = (options._defaultAgent && options._defaultAgent.protocol === 'https:')
                    || (options.href && options.href.slice(0,6) === 'https')

    if (!options.href) {
      // options.path can contain query parameters, which url.format will not-so-kindly urlencode for us...
      // so just append it to the resultant URL string
      options.href = url.format({
        protocol: isHttps ? 'https:' : 'http:',
        slashes: true,
        hostname: options.host,
        port: options.port,
      }) + options.path

      if (!options.uri) {
        options.uri = url.parse(options.href)
      }
    }

    if (isHttps) {
      return this.httpsAgent.addRequest(req, options)
    }

    return this.httpAgent.addRequest(req, options)
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

    delete req._header // so we can set headers again

    req.setHeader('host', `${options.host}:${options.port}`)
    if (proxy.auth) {
      req.setHeader('proxy-authorization', `basic ${Buffer.from(proxy.auth).toString('base64')}`)
    }

    // node has queued an HTTP message to be sent already, so we need to regenerate the
    // queued message with the new path and headers
    // https://github.com/TooTallNate/node-http-proxy-agent/blob/master/index.js#L93
    regenerateRequestHead(req)

    options.port = proxy.port
    options.host = proxy.hostname
    delete options.path // so the underlying net.connect doesn't default to IPC

    if (proxy.protocol === 'https:') {
      // gonna have to use the https module to reach the proxy, even though this is an http req
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

  _createProxiedConnection (options, cb) {
    // heavily inspired by
    // https://github.com/mknj/node-keepalive-proxy-agent/blob/master/index.js
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

    const port = options.uri.port || 443

    let connectReq = `CONNECT ${options.uri.hostname}:${port} HTTP/1.1\r\n`

    connectReq += `Host: ${options.uri.hostname}:${port}\r\n`

    if (proxy.auth) {
      connectReq += `Proxy-Authorization: basic ${Buffer.from(proxy.auth).toString('base64')}\r\n`
    }

    connectReq += '\r\n'
    proxySocket.write(connectReq)
  }
}

module.exports = new CombinedAgent()

module.exports.CombinedAgent = CombinedAgent
