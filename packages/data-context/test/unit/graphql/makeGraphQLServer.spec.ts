import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import fetch from 'cross-fetch'
import WebSocket from 'ws'

import { setCtx } from '../../../src'
import type { DataContext } from '../../../src'
import { makeGraphQLServer } from '../../../graphql/makeGraphQLServer'
import { createTestDataContext } from '../helper'

const EVIL_ORIGIN = 'https://evil.example.com'
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
      const result = await openWs(EVIL_ORIGIN)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(403)
    })

    it('rejects upgrade with Cypress Cloud Origin (no cloud exception for WS)', async () => {
      const result = await openWs(PRODUCTION_CLOUD_ORIGIN)

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

    it('accepts handshake with the server\'s own origin', async () => {
      const result = await attemptSocketIoUpgrade(ownOrigin)

      expect(result.opened).toBe(true)
    })

    it('rejects handshake with a different-port localhost origin', async () => {
      const result = await attemptSocketIoUpgrade(OTHER_LOCALHOST_ORIGIN)

      expect(result.opened).toBe(false)
    })

    it('rejects handshake with non-localhost Origin', async () => {
      const result = await attemptSocketIoUpgrade(EVIL_ORIGIN)

      expect(result.opened).toBe(false)
    })

    it('rejects handshake with Cypress Cloud Origin', async () => {
      const result = await attemptSocketIoUpgrade(PRODUCTION_CLOUD_ORIGIN)

      expect(result.opened).toBe(false)
    })
  })
})
