/* eslint-disable
    no-console,
*/
import http from 'http'
import type { IncomingMessage, ServerResponse } from 'http'

export const srv = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  console.log('HTTP SERVER REQUEST URL:', req.url)
  console.log('HTTP SERVER REQUEST HEADERS:', req.headers)

  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)

  res.end('<html><body>http server</body></html>')
})

export const start = () => {
  return new Promise<http.Server>((resolve) => {
    srv.listen(8080, () => {
      console.log('server listening on port: 8080')

      resolve(srv)
    })
  })
}

export const stop = () => {
  return new Promise<Error | undefined>((resolve) => {
    srv.close(resolve)
  })
}
