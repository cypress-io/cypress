import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CDPBrowserSocket } from '../lib/client/cdp-browser'
import { decode, encode } from '../lib/utils'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('CDPBrowserSocket', () => {
  const namespace = '/default'
  let sendToServer: ReturnType<typeof vi.fn>

  beforeEach(() => {
    sendToServer = vi.fn()
    vi.stubGlobal('window', {
      [`cypressSendToServer-${namespace}`]: sendToServer,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const lastPayloadSent = async () => {
    const payload = JSON.parse(sendToServer.mock.calls[sendToServer.mock.calls.length - 1][0])

    return decode(payload)
  }

  it('emits the event with a generated v4 UUID as the callback key', async () => {
    const socket = new CDPBrowserSocket(namespace)

    await socket.emit('some:event', { foo: 'bar' })

    const [event, uuid, args] = await lastPayloadSent()

    expect(event).toBe('some:event')
    expect(uuid).toMatch(UUID_V4)
    expect(args).toEqual([{ foo: 'bar' }])
  })

  it('generates a distinct UUID for each emit', async () => {
    const socket = new CDPBrowserSocket(namespace)

    await socket.emit('event:a')
    const [, firstUuid] = await lastPayloadSent()

    await socket.emit('event:b')
    const [, secondUuid] = await lastPayloadSent()

    expect(firstUuid).not.toBe(secondUuid)
  })

  it('invokes a passed callback when the server acks the generated UUID', async () => {
    const socket = new CDPBrowserSocket(namespace)
    const callback = vi.fn()

    await socket.emit('needs:ack', { hello: 'world' }, callback)

    const [event, uuid, args] = await lastPayloadSent()

    expect(event).toBe('needs:ack')
    expect(uuid).toMatch(UUID_V4)
    // the callback is not sent over the wire, only the args before it
    expect(args).toEqual([{ hello: 'world' }])
    expect(callback).not.toHaveBeenCalled()

    // simulate the server responding by emitting an event named after the callback UUID
    const response = await encode([uuid, crypto.randomUUID(), ['ack:result']], namespace)

    await window[`cypressSocket-${namespace}`].send!(JSON.stringify(response))

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('ack:result')
  })
})
