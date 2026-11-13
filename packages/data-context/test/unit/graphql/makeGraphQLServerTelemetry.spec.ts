import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import fetch from 'cross-fetch'
import { client } from '@packages/socket/lib/client'
import type { SocketShape } from '@packages/socket/lib/client'
import { telemetry } from '@packages/telemetry'

import { setCtx } from '../../../src'
import type { DataContext } from '../../../src'
import { makeGraphQLServer } from '../../../graphql/makeGraphQLServer'
import { createTestDataContext } from '../helper'

describe('makeGraphQLServer with telemetry enabled', () => {
  let ctx: DataContext
  let port: number
  let send: jest.Mock<(payload: string, onSuccess: () => void, onError: (err: Error) => void) => void>

  beforeAll(async () => {
    delete process.env.CYPRESS_INTERNAL_GRAPHQL_PORT
    process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY = 'true'

    send = jest.fn()
    jest.spyOn(telemetry, 'exporter').mockReturnValue({ send } as any)

    ctx = createTestDataContext('open')
    setCtx(ctx)
    jest.spyOn(ctx.html, 'launchpadHtml').mockResolvedValue('<body>launchpad with telemetry</body>')
    port = await makeGraphQLServer()
  })

  afterAll(async () => {
    delete process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY
    jest.restoreAllMocks()

    await new Promise<void>((resolve) => {
      const srv = ctx.coreData.servers.gqlServer

      if (!srv) {
        return resolve()
      }

      srv.close(() => resolve())
    })
  })

  it('serves the launchpad entry page with the telemetry bootstrap', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/__launchpad/index.html`)

    expect(res.headers.get('content-type')).toContain('text/html')
    await expect(res.text()).resolves.toBe('<body>launchpad with telemetry</body>')
  })

  describe('/telemetry socket namespace', () => {
    let socket: SocketShape

    const backendRequest = (eventName: string, payload: string) => {
      return new Promise<any>((resolve) => socket.emit('backend:request', eventName, payload, resolve))
    }

    beforeAll(async () => {
      socket = client(`http://localhost:${port}/telemetry`, {
        path: '/__launchpad/socket',
        transports: ['websocket'],
        extraHeaders: { Origin: `http://localhost:${port}` },
      })

      await new Promise<void>((resolve, reject) => {
        socket.once('connect', resolve)
        socket.once('connect_error', reject)
      })
    })

    afterAll(() => {
      socket.close()
    })

    it('forwards spans from the launchpad to the exporter', async () => {
      const res = await backendRequest('telemetry', '{"resourceSpans":[]}')

      expect(res).toBeUndefined()
      expect(send).toHaveBeenCalledWith('{"resourceSpans":[]}', expect.any(Function), expect.any(Function))
    })

    it('rejects any other backend request', async () => {
      send.mockClear()

      const res = await backendRequest('run:privileged', '{}')

      expect(res.error.message).toBe('The launchpad telemetry socket cannot handle: run:privileged')
      expect(send).not.toHaveBeenCalled()
    })
  })
})
