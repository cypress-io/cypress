/* eslint-disable
    no-console,
*/
import https from 'https'
import { allowDestroy } from '@packages/network'
import { options } from './certs'
import type { IncomingMessage, ServerResponse } from 'http'

const defaultOnRequest = function (req: IncomingMessage, res: ServerResponse) {
  console.log('HTTPS SERVER REQUEST URL:', req.url)
  console.log('HTTPS SERVER REQUEST HEADERS:', req.headers)

  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)

  res.end('<html><head></head><body>https server</body></html>')
}

let servers: https.Server<typeof IncomingMessage, typeof ServerResponse>[] = []

export const create = (onRequest: (req: IncomingMessage, res: ServerResponse) => void) => {
  return https.createServer(options, onRequest != null ? onRequest : defaultOnRequest)
}

export const start = (port: number, onRequest?: (req: IncomingMessage, res: ServerResponse) => void) => {
  return new Promise<https.Server>((resolve) => {
    const srv = create(onRequest)

    allowDestroy(srv)

    servers.push(srv)

    srv.listen(port, () => {
      console.log(`server listening on port: ${port}`)

      resolve(srv)
    })
  })
}

export const stop = async () => {
  const stopServer = (srv: https.Server) => {
    return new Promise<Error | undefined>((resolve) => {
      srv.destroy(resolve)
    })
  }

  await Promise.all(servers.map((server) => stopServer(server)))

  servers = []
}
