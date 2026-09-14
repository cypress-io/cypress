import { describe, it, expect, vi } from 'vitest'
import { CDPSocket, CDPSocketServer } from '../lib/node/cdp-socket'

describe('CDPSocketServer', () => {
  it('closes the previous socket when a new client is attached', async () => {
    const makeClient = () => ({ send: vi.fn().mockResolvedValue({}), on: vi.fn(), off: vi.fn() })
    const server = new CDPSocketServer({ path: '/__socket' })
    const first = makeClient()
    const second = makeClient()

    await server.attachCDPClient(first as any)
    await server.attachCDPClient(second as any)

    expect(first.off).toHaveBeenCalledWith('Runtime.bindingCalled', expect.any(Function))
    expect(second.off).not.toHaveBeenCalled()
  })
})

describe('CDPSocket', () => {
  it('emits via Runtime.evaluate with returnByValue', async () => {
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
