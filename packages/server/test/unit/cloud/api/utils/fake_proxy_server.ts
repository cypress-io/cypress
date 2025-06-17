/* eslint-disable no-console */
import http from 'http'
import _ from 'lodash'
import net, { AddressInfo } from 'net'
import express from 'express'
import Promise from 'bluebird'
import debugLib from 'debug'

const debug = debugLib('cypress:test:fake_proxy_server')

export async function fakeClientServer () {
  const app = express()

  app.post('/ping', (req, res) => {
    res.json({ ok: true })
  })

  const srv = await new Promise<http.Server>((resolve) => {
    const _srv = app.listen(() => {
      resolve(_srv)
    })
  })

  return {
    port: (srv.address() as AddressInfo).port,
    teardown: () => Promise.fromCallback((cb) => srv.close(cb)),
  }
}

export async function fakeProxyServer (onRequest: (msg: http.IncomingMessage) => http.IncomingMessage = _.identity) {
  // Fake HTTP Proxy Server
  const proxy = http.createServer((req, res) => {
    _requests.push(req)
    const target = new URL(req.url)
    const options = {
      hostname: target.hostname,
      port: target.port || 80,
      path: target.pathname,
      method: req.method,
      headers: req.headers,
    } as http.RequestOptions

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })

    req.pipe(proxyReq)

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err)
      res.writeHead(502)
      res.end('Bad Gateway')
    })
  })

  let _requests: http.IncomingMessage[] = []

  // Handle HTTPS tunneling via CONNECT
  proxy.on('connect', (req, clientSocket, head) => {
    _requests.push(req)
    req = onRequest(req)

    const { port, hostname } = new URL(`http://${req.url}`)

    debug(`CONNECT to ${hostname}:${port}`)

    // Connect to the target server
    const serverSocket = net.connect(Number(port ?? 443), hostname, () => {
    // Send 200 OK to client
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')

      // Pipe data between client and target
      serverSocket.write(head)
      serverSocket.pipe(clientSocket)
      clientSocket.pipe(serverSocket)
    })

    serverSocket.on('error', (err) => {
      console.error(`Error connecting to ${hostname}:${port} -`, err.message)
      clientSocket.end()
    })
  })

  await new Promise((resolve) => {
    proxy.listen(() => {
      resolve()
    })
  })

  const port = (proxy.address() as AddressInfo).port

  debug(`HTTPS CONNECT proxy running at http://localhost:${port}`)

  return {
    port,
    teardown: () => {
      _requests = []

      return Promise.fromCallback((cb) => {
        proxy.close(cb)
      })
    },
    get requests () {
      return _requests
    },
  }
}
