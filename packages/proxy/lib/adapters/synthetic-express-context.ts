import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { Readable, Writable } from 'stream'
import type { CookieOptions } from 'express'
import type { HttpHeaders, HttpRequest, HttpResponse } from '@packages/network-interception'
import type {
  CypressHeaderValue,
  CypressIncomingRequest,
  CypressOutgoingResponseLike,
} from '../types'

type HeaderValue = CypressHeaderValue

function normalizeHeaderName (name: string): string {
  return name.toLowerCase()
}

function parseCookieHeader (header?: string | string[]): Record<string, string> {
  const raw = Array.isArray(header) ? header.join('; ') : header

  if (!raw) {
    return {}
  }

  return raw.split(';').reduce<Record<string, string>>((memo, part) => {
    const [name, ...value] = part.trim().split('=')

    if (name) {
      memo[name] = decodeURIComponent(value.join('=') || '')
    }

    return memo
  }, {})
}

function serializeCookie (name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  const path = options.path == null ? '/' : options.path

  parts.push(`Path=${path}`)

  if (options.domain) {
    parts.push(`Domain=${options.domain}`)
  }

  if (options.maxAge != null) {
    const maxAgeMs = Number(options.maxAge)

    if (!Number.isNaN(maxAgeMs)) {
      parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`)
      parts.push(`Expires=${new Date(Date.now() + maxAgeMs).toUTCString()}`)
    }
  } else if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`)
  }

  if (options.httpOnly) {
    parts.push('HttpOnly')
  }

  if (options.secure) {
    parts.push('Secure')
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite === true ? 'Strict' : options.sameSite}`)
  }

  return parts.join('; ')
}

export function createRequestBodyStream (body?: string | Buffer): Readable {
  if (typeof body === 'undefined') {
    return Readable.from([])
  }

  return Readable.from([body])
}

export type SyntheticCypressResponse = CypressOutgoingResponseLike & {
  getCapturedBody (): Buffer
  getCapturedHeaders (): HttpHeaders
  getCapturedStatusCode (): number
}

class SyntheticResponse extends Writable {
  isInitial: null | boolean = null
  wantsInjection: CypressOutgoingResponseLike['wantsInjection'] = false
  wantsSecurityRemoved: null | boolean = null
  body?: string | Readable
  statusCode = 200
  statusMessage = ''
  headersSent = false

  private readonly headers: Record<string, { name: string, value: HeaderValue }> = {}
  private readonly chunks: Buffer[] = []

  _write (chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.headersSent = true
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    callback()
  }

  set (nameOrHeaders: string | Record<string, HeaderValue>, value?: HeaderValue) {
    if (typeof nameOrHeaders === 'string') {
      this.setHeader(nameOrHeaders, value!)

      return this
    }

    Object.entries(nameOrHeaders).forEach(([name, headerValue]) => {
      this.setHeader(name, headerValue)
    })

    return this
  }

  status (statusCode: number) {
    this.statusCode = statusCode

    return this
  }

  redirect (statusOrUrl: number | string, maybeUrl?: string) {
    const statusCode = typeof statusOrUrl === 'number' ? statusOrUrl : 302
    const url = typeof statusOrUrl === 'number' ? maybeUrl! : statusOrUrl

    this.status(statusCode)
    this.setHeader('Location', url)
    this.end()

    return this
  }

  cookie (name: string, value: string, options?: CookieOptions) {
    const serialized = serializeCookie(name, value, options)
    const existing = this.getHeader('Set-Cookie')

    this.setHeader('Set-Cookie', existing ? ([] as string[]).concat(existing as any, serialized) : serialized)

    return this
  }

  writeHead (statusCode: number, headers?: Record<string, HeaderValue>) {
    this.status(statusCode)

    if (headers) {
      this.set(headers)
    }

    return this
  }

  setHeader (name: string, value: HeaderValue) {
    if (typeof value === 'undefined') {
      this.removeHeader(name)

      return this
    }

    this.headers[normalizeHeaderName(name)] = { name, value }

    return this
  }

  append (name: string, value: HeaderValue) {
    const existing = this.getHeader(name)

    this.setHeader(name, existing ? ([] as string[]).concat(existing as any, value as any) : value)

    return this
  }

  getHeader (name: string) {
    return this.headers[normalizeHeaderName(name)]?.value
  }

  getHeaders () {
    return Object.entries(this.headers).reduce<Record<string, HeaderValue>>((memo, [name, { value }]) => {
      memo[name] = value

      return memo
    }, {})
  }

  getHeaderNames () {
    return Object.keys(this.headers)
  }

  removeHeader (name: string) {
    delete this.headers[normalizeHeaderName(name)]
  }

  end (chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void): this {
    this.headersSent = true

    return super.end(chunk, encoding as BufferEncoding, cb)
  }

  getCapturedBody (): Buffer {
    return Buffer.concat(this.chunks)
  }

  getCapturedHeaders (): HttpHeaders {
    return Object.values(this.headers).reduce<HttpHeaders>((memo, { name, value }) => {
      memo[name] = Array.isArray(value) ? value.map(String) : String(value)

      return memo
    }, {})
  }

  getCapturedStatusCode (): number {
    return this.statusCode
  }
}

export function createSyntheticIncomingResponse (response: HttpResponse): IncomingMessage {
  const incomingRes = new IncomingMessage(new Socket())

  incomingRes.statusCode = response.statusCode ?? 200
  incomingRes.headers = response.headers ?? {}

  return incomingRes
}

export function createSyntheticExpressContext (request: HttpRequest): {
  req: CypressIncomingRequest
  res: SyntheticCypressResponse
} {
  const req = createRequestBodyStream(request.body) as CypressIncomingRequest
  const headers = request.headers ?? {}

  req.method = request.method ?? 'GET'
  req.headers = headers
  req.cookies = parseCookieHeader(headers.cookie)
  req.proxiedUrl = request.url
  req.originalUrl = request.url
  req.url = request.url
  req.body = request.body
  req.requestId = request.id
  req.isAUTFrame = false
  req.isFromExtraTarget = false
  req.isSyncRequest = false

  return {
    req,
    res: new SyntheticResponse(),
  }
}
