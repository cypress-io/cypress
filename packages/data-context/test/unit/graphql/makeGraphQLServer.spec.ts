import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals'
import { createServer, request } from 'http'
import type { ClientRequest, IncomingMessage, Server } from 'http'
import type { AddressInfo } from 'net'
import fetch from 'cross-fetch'
import WebSocket from 'ws'

import { setCtx } from '../../../src'
import type { DataContext } from '../../../src'
import { graphqlWS, makeGraphQLServer } from '../../../graphql/makeGraphQLServer'
import { createTestDataContext } from '../helper'

const OTHER_ORIGIN = 'https://other.example.com'
const PRODUCTION_CLOUD_ORIGIN = 'https://cloud.cypress.io'
const DEV_CLOUD_ORIGIN = 'http://localhost:3000'
const OTHER_LOCALHOST_ORIGIN = 'http://localhost:9999'

describe('makeGraphQLServer (integration)', () => {
  let ctx: DataContext
  let port: number
  let baseUrl: string
  let ownOrigin: string

  beforeAll(async () => {
    delete process.env.CYPRESS_INTERNAL_GRAPHQL_PORT
    ctx = createTestDataContext('open')
    setCtx(ctx)
    port = await makeGraphQLServer()
    baseUrl = `http://127.0.0.1:${port}`
    ownOrigin = `http://localhost:${port}`
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      const srv = ctx.coreData.servers.gqlServer

      if (!srv) {
        return resolve()
      }

      srv.close(() => resolve())
    })
  })

  describe('HTTP CORS', () => {
    it('echoes Access-Control-Allow-Origin for the server\'s own origin on /__launchpad/graphql', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'OPTIONS',
        headers: {
          'Origin': ownOrigin,
          'Access-Control-Request-Method': 'POST',
        },
      })

      expect(res.headers.get('access-control-allow-origin')).toBe(ownOrigin)
    })

    it('omits Access-Control-Allow-Origin for a different-port localhost origin', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'OPTIONS',
        headers: {
          'Origin': OTHER_LOCALHOST_ORIGIN,
          'Access-Control-Request-Method': 'POST',
        },
      })

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('omits Access-Control-Allow-Origin for non-localhost origins on /__launchpad/graphql', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'OPTIONS',
        headers: {
          'Origin': OTHER_ORIGIN,
          'Access-Control-Request-Method': 'POST',
        },
      })

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('omits Access-Control-Allow-Origin for Cypress Cloud origin on /__launchpad/graphql', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'OPTIONS',
        headers: {
          'Origin': PRODUCTION_CLOUD_ORIGIN,
          'Access-Control-Request-Method': 'POST',
        },
      })

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('echoes Access-Control-Allow-Origin for production Cypress Cloud on /cloud-notification', async () => {
      const res = await fetch(`${baseUrl}/cloud-notification?operationName=orgCreated`, {
        headers: { 'Origin': PRODUCTION_CLOUD_ORIGIN },
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('access-control-allow-origin')).toBe(PRODUCTION_CLOUD_ORIGIN)
    })

    it('echoes Access-Control-Allow-Origin for dev Cypress Cloud (localhost:3000) on /cloud-notification', async () => {
      const res = await fetch(`${baseUrl}/cloud-notification?operationName=orgCreated`, {
        headers: { 'Origin': DEV_CLOUD_ORIGIN },
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('access-control-allow-origin')).toBe(DEV_CLOUD_ORIGIN)
    })

    it('omits Access-Control-Allow-Origin for arbitrary origins on /cloud-notification', async () => {
      const res = await fetch(`${baseUrl}/cloud-notification?operationName=orgCreated`, {
        headers: { 'Origin': OTHER_ORIGIN },
      })

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })
  })

  describe('HTTP origin enforcement on /__launchpad/graphql', () => {
    const postQuery = (headers: Record<string, string>) => {
      return fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ query: '{ __typename }' }),
      })
    }

    it('executes a request from the server\'s own origin', async () => {
      const res = await postQuery({ 'Origin': ownOrigin })

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ data: { __typename: 'Query' } })
    })

    it('executes a request from the server\'s own port on 127.0.0.1', async () => {
      const res = await postQuery({ 'Origin': baseUrl })

      expect(res.status).toBe(200)
    })

    it('executes a request with no Origin', async () => {
      const res = await postQuery({})

      expect(res.status).toBe(200)
    })

    it('refuses a request from a non-localhost origin', async () => {
      const res = await postQuery({ 'Origin': OTHER_ORIGIN })

      expect(res.status).toBe(403)
    })

    it('refuses a request from a different-port localhost origin', async () => {
      const res = await postQuery({ 'Origin': OTHER_LOCALHOST_ORIGIN })

      expect(res.status).toBe(403)
    })

    it('refuses a request whose Origin names another host on the server\'s port', async () => {
      const res = await postQuery({ 'Origin': `http://app.other.example.com:${port}` })

      expect(res.status).toBe(403)
    })

    it('refuses a form-encoded request from a different origin, which a browser sends without a preflight', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'POST',
        headers: { 'Origin': OTHER_ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `query=${encodeURIComponent('{ __typename }')}`,
      })

      expect(res.status).toBe(403)
    })

    it('refuses a different origin on the named-operation path', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql/SomeOperation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': OTHER_ORIGIN },
        body: JSON.stringify({ query: '{ __typename }' }),
      })

      expect(res.status).toBe(403)
    })
  })

  describe('Host enforcement', () => {
    const get = (path: string, host: string): Promise<{ status: number, body: string }> => {
      return new Promise((resolve, reject) => {
        const req = request({ host: '127.0.0.1', port, path, headers: { Host: host } }, (res) => {
          let body = ''

          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            body += chunk
          })

          res.on('end', () => resolve({ status: res.statusCode!, body }))
        })

        req.on('error', reject)
        req.end()
      })
    }

    const queryPath = `/__launchpad/graphql?query=${encodeURIComponent('{ __typename }')}`

    it('executes a GET query with no Origin from a localhost Host', async () => {
      const res = await get(queryPath, `localhost:${port}`)

      expect(res.status).toBe(200)
      expect(JSON.parse(res.body)).toEqual({ data: { __typename: 'Query' } })
    })

    it('refuses a GET query with no Origin from a non-localhost Host', async () => {
      const res = await get(queryPath, `app.other.example.com:${port}`)

      expect(res.status).toBe(403)
    })

    it('refuses a localhost Host on a different port', async () => {
      const res = await get(queryPath, 'localhost:9999')

      expect(res.status).toBe(403)
    })

    it('refuses other routes from a non-localhost Host', async () => {
      expect((await get('/__launchpad/index.html', `app.other.example.com:${port}`)).status).toBe(403)
      expect((await get('/cloud-notification', `app.other.example.com:${port}`)).status).toBe(403)
    })
  })

  describe('WebSocket upgrade on /__launchpad/graphql-ws', () => {
    function openWs (origin: string | undefined, host?: string): Promise<{ opened: boolean, statusCode?: number }> {
      return new Promise((resolve) => {
        const headers: Record<string, string> = {}

        if (origin !== undefined) {
          headers.Origin = origin
        }

        if (host !== undefined) {
          headers.Host = host
        }

        const ws = new WebSocket(`ws://127.0.0.1:${port}/__launchpad/graphql-ws`, 'graphql-transport-ws', { headers })
        let opened = false
        let statusCode: number | undefined
        let done = false

        const finish = () => {
          if (done) return

          done = true
          resolve({ opened, statusCode })
        }

        ws.once('open', () => {
          opened = true
          ws.close()
        })

        ws.once('unexpected-response', (_req, res) => {
          statusCode = res.statusCode
          ws.terminate()
          finish()
        })

        ws.once('close', () => finish())
        ws.once('error', () => {})
      })
    }

    it('accepts upgrade with no Origin', async () => {
      const result = await openWs(undefined)

      expect(result.opened).toBe(true)
    })

    it('accepts upgrade with the server\'s own origin', async () => {
      const result = await openWs(ownOrigin)

      expect(result.opened).toBe(true)
    })

    it('rejects upgrade with a different-port localhost origin (403)', async () => {
      const result = await openWs(OTHER_LOCALHOST_ORIGIN)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })

    it('rejects upgrade with non-localhost Origin (403)', async () => {
      const result = await openWs(OTHER_ORIGIN)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })

    it('rejects upgrade with Cypress Cloud Origin (no cloud exception for WS)', async () => {
      const result = await openWs(PRODUCTION_CLOUD_ORIGIN)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })

    it('rejects upgrade with no Origin from a non-localhost Host (403)', async () => {
      const result = await openWs(undefined, `app.other.example.com:${port}`)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })
  })

  describe('Socket.IO upgrade on /__launchpad/socket', () => {
    function attemptSocketIoUpgrade (origin: string | undefined, host?: string): Promise<{ opened: boolean }> {
      return new Promise((resolve) => {
        const headers: Record<string, string> = {}

        if (origin !== undefined) {
          headers.Origin = origin
        }

        if (host !== undefined) {
          headers.Host = host
        }

        const ws = new WebSocket(`ws://127.0.0.1:${port}/__launchpad/socket/?EIO=4&transport=websocket`, { headers })
        let opened = false
        let done = false

        const finish = () => {
          if (done) return

          done = true
          resolve({ opened })
        }

        ws.once('open', () => {
          opened = true
          ws.close()
        })

        ws.once('unexpected-response', () => {
          ws.terminate()
          finish()
        })

        ws.once('close', () => finish())
        ws.once('error', () => {})
      })
    }

    it('accepts handshake with the server\'s own origin', async () => {
      const result = await attemptSocketIoUpgrade(ownOrigin)

      expect(result.opened).toBe(true)
    })

    it('rejects handshake with a different-port localhost origin', async () => {
      const result = await attemptSocketIoUpgrade(OTHER_LOCALHOST_ORIGIN)

      expect(result.opened).toBe(false)
    })

    it('rejects handshake with non-localhost Origin', async () => {
      const result = await attemptSocketIoUpgrade(OTHER_ORIGIN)

      expect(result.opened).toBe(false)
    })

    it('rejects handshake with Cypress Cloud Origin', async () => {
      const result = await attemptSocketIoUpgrade(PRODUCTION_CLOUD_ORIGIN)

      expect(result.opened).toBe(false)
    })

    it('rejects handshake with no Origin from a non-localhost Host', async () => {
      const result = await attemptSocketIoUpgrade(undefined, `app.other.example.com:${port}`)

      expect(result.opened).toBe(false)
    })
  })
})

describe('graphqlWS helper', () => {
  const servers: Array<{ server: Server, dispose: () => Promise<void> }> = []

  afterEach(async () => {
    while (servers.length > 0) {
      const { server, dispose } = servers.pop()!

      await dispose()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  async function startServerWithGraphqlWS (options: { enforceOrigin?: boolean }) {
    const server = createServer()
    const handle = graphqlWS(server, '/__socket-graphql', options)

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

    const port = (server.address() as AddressInfo).port

    servers.push({ server, dispose: handle.dispose })

    return { port }
  }

  function openWs (port: number, origin: string | undefined): Promise<{ opened: boolean, statusCode?: number }> {
    return new Promise((resolve) => {
      const headers: Record<string, string> = {}

      if (origin !== undefined) {
        headers.Origin = origin
      }

      const ws = new WebSocket(`ws://127.0.0.1:${port}/__socket-graphql`, 'graphql-transport-ws', { headers })
      let opened = false
      let statusCode: number | undefined
      let done = false

      const finish = () => {
        if (done) return

        done = true
        resolve({ opened, statusCode })
      }

      ws.once('open', () => {
        opened = true
        ws.close()
      })

      ws.once('unexpected-response', (_req: ClientRequest, res: IncomingMessage) => {
        statusCode = res.statusCode
        ws.terminate()
        finish()
      })

      ws.once('close', () => finish())
      // Swallow socket-level errors (e.g. ECONNRESET on the server's 403 close); 'unexpected-response' and 'close' are what we read.
      ws.once('error', () => {})
    })
  }

  describe('with default options (enforceOrigin: true)', () => {
    it('rejects upgrade when Origin port does not match the server listen port', async () => {
      const { port } = await startServerWithGraphqlWS({})

      const result = await openWs(port, 'http://localhost:3000')

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })

    it('rejects upgrade with a non-localhost Origin', async () => {
      const { port } = await startServerWithGraphqlWS({})

      const result = await openWs(port, OTHER_ORIGIN)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })

    it('accepts upgrade with the server\'s own origin', async () => {
      const { port } = await startServerWithGraphqlWS({})

      const result = await openWs(port, `http://localhost:${port}`)

      expect(result.opened).toBe(true)
    })

    it('accepts upgrade with no Origin header', async () => {
      const { port } = await startServerWithGraphqlWS({})

      const result = await openWs(port, undefined)

      expect(result.opened).toBe(true)
    })
  })

  describe('with enforceOrigin: false (used by the test-runner server)', () => {
    it('accepts upgrade when Origin port does not match the server listen port', async () => {
      const { port } = await startServerWithGraphqlWS({ enforceOrigin: false })

      const result = await openWs(port, 'http://localhost:3000')

      expect(result.opened).toBe(true)
    })

    it('accepts upgrade with a non-localhost Origin', async () => {
      const { port } = await startServerWithGraphqlWS({ enforceOrigin: false })

      const result = await openWs(port, OTHER_ORIGIN)

      expect(result.opened).toBe(true)
    })

    it('accepts upgrade with no Origin header', async () => {
      const { port } = await startServerWithGraphqlWS({ enforceOrigin: false })

      const result = await openWs(port, undefined)

      expect(result.opened).toBe(true)
    })
  })
})
