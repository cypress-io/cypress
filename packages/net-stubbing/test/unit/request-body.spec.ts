import { afterEach, describe, expect, it } from 'vitest'
import http from 'http'
import net from 'net'
import { bufferRequestBody } from '../../lib/server/request-body'

const noopDebug = () => {}

const rawPost = (body: string, contentLength = Buffer.byteLength(body)) => {
  return [
    'POST /intercepted HTTP/1.1',
    'Host: localhost',
    'Content-Type: application/x-www-form-urlencoded',
    `Content-Length: ${contentLength}`,
    '',
    body,
  ].join('\r\n')
}

const waitFor = async (predicate: () => boolean, description: string) => {
  const deadline = Date.now() + 2000

  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error(`timed out waiting for ${description}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

describe('bufferRequestBody', () => {
  let server: http.Server | undefined
  let client: net.Socket | undefined

  afterEach(async () => {
    client?.destroy()
    client = undefined

    if (server) {
      const closing = server

      server = undefined
      await new Promise<void>((resolve) => closing.close(() => resolve()))
    }
  })

  /**
   * Writes a raw request to a real Node HTTP server and hands back the
   * server-side request/response, so tests can close the client connection at
   * an exact point in the request's lifecycle.
   */
  const sendRawRequest = async (raw: string) => {
    server = http.createServer()

    const incoming = new Promise<{ req: http.IncomingMessage, res: http.ServerResponse }>((resolve) => {
      server!.once('request', (req, res) => resolve({ req, res }))
    })

    const port = await new Promise<number>((resolve) => {
      server!.listen(0, '127.0.0.1', () => resolve((server!.address() as net.AddressInfo).port))
    })

    client = net.connect(port, '127.0.0.1')
    client.on('error', () => {})

    await new Promise<void>((resolve) => client!.once('connect', resolve))

    client.write(raw)

    return { ...await incoming, client: client! }
  }

  it('resolves with the request body', async () => {
    const body = 'name=cypress&kind=intercept'
    const { req, res } = await sendRawRequest(rawPost(body))

    expect(await bufferRequestBody(req as any, res as any, noopDebug)).toEqual(Buffer.from(body))
  })

  // https://github.com/cypress-io/cypress/issues/26431
  it('recovers a body that arrived before the browser closed the connection', async () => {
    const body = 'name=cypress&kind=intercept'
    const { req, res, client } = await sendRawRequest(rawPost(body))

    await waitFor(() => req.readableLength >= Buffer.byteLength(body), 'the body to reach the server')

    // the browser navigates away, aborts the fetch, or tears down between tests
    // before anything has read the request body
    client.destroy()
    await waitFor(() => res.destroyed, 'the connection to close')

    expect(await bufferRequestBody(req as any, res as any, noopDebug)).toEqual(Buffer.from(body))
  })

  it('recovers the bytes received so far when the connection closes mid-body', async () => {
    const partial = 'name=cypress'
    const { req, res, client } = await sendRawRequest(rawPost(partial, Buffer.byteLength(partial) + 32))

    await waitFor(() => req.readableLength >= Buffer.byteLength(partial), 'the partial body to reach the server')

    const buffered = bufferRequestBody(req as any, res as any, noopDebug)

    client.destroy()

    expect(await buffered).toEqual(Buffer.from(partial))
  })

  it('resolves with an empty body when the connection closes before any body arrives', async () => {
    const { req, res, client } = await sendRawRequest(rawPost('', 32))

    const buffered = bufferRequestBody(req as any, res as any, noopDebug)

    client.destroy()

    expect(await buffered).toEqual(Buffer.from(''))
  })
})
