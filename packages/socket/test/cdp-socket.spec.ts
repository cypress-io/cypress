import { describe, it, expect, vi } from 'vitest'
import { CDPSocket } from '../lib/node/cdp-socket'

describe('CDPSocket', () => {
  it('emits via Runtime.evaluate with returnByValue so the renderer does not pin a RemoteObject per message', async () => {
    const cdpClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }

    const socket = new CDPSocket(cdpClient as any, '/default')

    await socket.emit('some:event', { foo: 'bar' })

    const evaluateCalls = cdpClient.send.mock.calls.filter(([method]) => method === 'Runtime.evaluate')

    expect(evaluateCalls).toHaveLength(1)
    expect(evaluateCalls[0][1].returnByValue).toBe(true)
  })
})
