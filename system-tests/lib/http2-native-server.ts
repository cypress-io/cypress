import type { IncomingHttpHeaders } from 'http'
import type { Http2ServerRequest, Http2ServerResponse, ServerHttp2Stream } from 'http2'

export type Http2NativeRegister = (
  method: string,
  path: string,
  handler: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders) => void,
) => void

export function createHttp2NativeRouter () {
  const routes: Record<string, (stream: ServerHttp2Stream, headers: IncomingHttpHeaders) => void> = {}

  const register: Http2NativeRegister = (method, path, handler) => {
    routes[`${method.toUpperCase()} ${path}`] = handler
  }

  const onStream = (stream: ServerHttp2Stream, headers: IncomingHttpHeaders) => {
    const method = String(headers[':method'] || 'GET').toUpperCase()
    const path = String(headers[':path'] || '/').split('?')[0]
    const handler = routes[`${method} ${path}`]

    if (!handler) {
      stream.respond({ ':status': 404, 'content-type': 'text/plain' })
      stream.end('Not Found')

      return
    }

    handler(stream, headers)
  }

  return { register, onStream }
}

export function respondJson (stream: ServerHttp2Stream, status: number, body: unknown) {
  const payload = JSON.stringify(body)

  stream.respond({
    ':status': status,
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
  })

  stream.end(payload)
}

export function respondHtml (stream: ServerHttp2Stream, status: number, html: string) {
  stream.respond({
    ':status': status,
    'content-type': 'text/html',
    'content-length': Buffer.byteLength(html),
  })

  stream.end(html)
}

export function respondText (stream: ServerHttp2Stream, status: number, body: string, contentType = 'text/plain') {
  stream.respond({
    ':status': status,
    'content-type': contentType,
    'content-length': Buffer.byteLength(body),
  })

  stream.end(body)
}

export type { Http2ServerRequest, Http2ServerResponse, ServerHttp2Stream }
