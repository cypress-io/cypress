/* eslint-disable no-console */
import request from '@cypress/request-promise'
import { allowDestroy } from '@packages/network'
import http from 'http'
import path from 'path'
import { create as createProxy, reset as resetProxy } from '../../lib/proxy'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Socket } from 'net'
import type { Server } from '../../lib/server'

let prx = null

const pipe = (req: IncomingMessage, res: ServerResponse) => {
  return req.pipe(request(req.url))
  .on('error', () => {
    console.log('**ERROR**', req.url)
    req.statusCode = 500

    res.end()
  }).pipe(res)
}

const onConnect = (req: IncomingMessage, socket: Socket, head: Buffer, proxy: any) => {
  return proxy.connect(req, socket, head, {
    onDirectConnection (req: IncomingMessage, socket: Socket, head: Buffer) {
      return ['localhost:8444', 'localhost:12344'].includes(req.url)
    },
  })
}

const onRequest = (req: IncomingMessage, res: ServerResponse) => {
  return pipe(req, res)
}

export const reset = () => resetProxy()

export const start = (port: number): Promise<Server> => {
  prx = http.createServer()

  allowDestroy(prx)

  const dir = path.join(process.cwd(), 'ca')

  return createProxy(dir, port, {
    onUpgrade (req: IncomingMessage, socket: Socket, head: Buffer) {},

    onRequest (req: IncomingMessage, res: ServerResponse) {
      console.log('ON REQUEST FROM OUTER PROXY', req.url, req.headers, req.method)

      if (req.url.includes('replace')) {
        const {
          write,
        } = res

        res.write = function (chunk) {
          chunk = Buffer.from(chunk.toString().replace('https server', 'replaced content'))

          return write.call(this, chunk)
        }

        return pipe(req, res)
      }

      return pipe(req, res)
    },
  })
  .then((proxy) => {
    prx.on('request', onRequest)

    prx.on('connect', (req, socket, head) => {
      return onConnect(req, socket, head, proxy)
    })

    return new Promise((resolve) => {
      prx.listen(port, () => {
        prx.proxy = proxy
        console.log(`server listening on port: ${port}`)

        resolve(proxy)
      })
    })
  })
}

export const stop = () => {
  return new Promise((resolve) => {
    return prx.destroy(resolve)
  }).then(() => {
    return prx.proxy.close()
  })
}
