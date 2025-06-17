/* eslint-disable no-console */
import http from 'http'
import _ from 'lodash'
import net, { AddressInfo } from 'net'
import express from 'express'
import pDefer from 'p-defer'
import Promise from 'bluebird'
import debugLib from 'debug'

const debug = debugLib('cypress:test:fake_proxy_server')

export const HTTP_FAKE_PROXY_SERVER_PORT = 4030

export async function fakeClientServer () {
  const app = express()

  app.post('/ping', (req, res) => {
    res.json({ ok: true })
  })

  const dfd = pDefer()

  const srv = app.listen(() => {
    dfd.resolve()
  })

  await dfd.promise

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

  const dfd = pDefer()

  proxy.listen(HTTP_FAKE_PROXY_SERVER_PORT, () => {
    debug(`HTTPS CONNECT proxy running at http://localhost:${HTTP_FAKE_PROXY_SERVER_PORT}`)
    dfd.resolve()
  })

  await dfd.promise

  return {
    port: HTTP_FAKE_PROXY_SERVER_PORT,
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
