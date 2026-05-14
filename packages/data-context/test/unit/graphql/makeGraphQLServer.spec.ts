import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import fetch from 'cross-fetch'
import WebSocket from 'ws'

import { setCtx, type DataContext } from '../../../src'
import { makeGraphQLServer } from '../../../graphql/makeGraphQLServer'
import { createTestDataContext } from '../helper'

const LOCALHOST_ORIGIN = 'http://localhost:9999'
const EVIL_ORIGIN = 'https://evil.example.com'
const CLOUD_ORIGIN = 'https://cloud.cypress.io'

describe('makeGraphQLServer (integration)', () => {
  let ctx: DataContext
  let port: number
  let baseUrl: string

  beforeAll(async () => {
    delete process.env.CYPRESS_INTERNAL_GRAPHQL_PORT
    ctx = createTestDataContext('open')
    setCtx(ctx)
    port = await makeGraphQLServer()
    baseUrl = `http://127.0.0.1:${port}`
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
    it('echoes Access-Control-Allow-Origin for localhost origins on /__launchpad/graphql', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'OPTIONS',
        headers: {
          'Origin': LOCALHOST_ORIGIN,
          'Access-Control-Request-Method': 'POST',
        },
      })

      expect(res.headers.get('access-control-allow-origin')).toBe(LOCALHOST_ORIGIN)
    })

    it('omits Access-Control-Allow-Origin for non-localhost origins on /__launchpad/graphql', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'OPTIONS',
        headers: {
          'Origin': EVIL_ORIGIN,
          'Access-Control-Request-Method': 'POST',
        },
      })

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('omits Access-Control-Allow-Origin for Cypress Cloud origin on /__launchpad/graphql', async () => {
      const res = await fetch(`${baseUrl}/__launchpad/graphql`, {
        method: 'OPTIONS',
        headers: {
          'Origin': CLOUD_ORIGIN,
          'Access-Control-Request-Method': 'POST',
        },
      })

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('echoes Access-Control-Allow-Origin for Cypress Cloud origin on /cloud-notification', async () => {
      const res = await fetch(`${baseUrl}/cloud-notification?operationName=orgCreated`, {
        headers: { 'Origin': CLOUD_ORIGIN },
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('access-control-allow-origin')).toBe(CLOUD_ORIGIN)
    })

    it('omits Access-Control-Allow-Origin for arbitrary origins on /cloud-notification', async () => {
      const res = await fetch(`${baseUrl}/cloud-notification?operationName=orgCreated`, {
        headers: { 'Origin': EVIL_ORIGIN },
      })

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })
  })

  describe('WebSocket upgrade on /__launchpad/graphql-ws', () => {
    function openWs (origin: string | undefined): Promise<{ opened: boolean, statusCode?: number }> {
      return new Promise((resolve) => {
        const headers: Record<string, string> = {}

        if (origin !== undefined) {
          headers.Origin = origin
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

    it('accepts upgrade with localhost Origin', async () => {
      const result = await openWs(LOCALHOST_ORIGIN)

      expect(result.opened).toBe(true)
    })

    it('rejects upgrade with non-localhost Origin (403)', async () => {
      const result = await openWs(EVIL_ORIGIN)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })

    it('rejects upgrade with Cypress Cloud Origin (no cloud exception for WS)', async () => {
      const result = await openWs(CLOUD_ORIGIN)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })
  })

  describe('Socket.IO upgrade on /__launchpad/socket', () => {
    function attemptSocketIoUpgrade (origin: string | undefined): Promise<{ opened: boolean }> {
      return new Promise((resolve) => {
        const headers: Record<string, string> = {}

        if (origin !== undefined) {
          headers.Origin = origin
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

    it('accepts handshake with localhost Origin', async () => {
      const result = await attemptSocketIoUpgrade(LOCALHOST_ORIGIN)

      expect(result.opened).toBe(true)
    })

    it('rejects handshake with non-localhost Origin', async () => {
      const result = await attemptSocketIoUpgrade(EVIL_ORIGIN)

      expect(result.opened).toBe(false)
    })

    it('rejects handshake with Cypress Cloud Origin', async () => {
      const result = await attemptSocketIoUpgrade(CLOUD_ORIGIN)

      expect(result.opened).toBe(false)
    })
  })
})
