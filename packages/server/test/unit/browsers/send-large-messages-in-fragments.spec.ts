import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { EventEmitter, once } from 'events'
import type { AddressInfo, Socket } from 'net'
import CDP from 'chrome-remote-interface'
import WebSocket from 'ws'
import { FRAGMENT_CHARS, MAX_QUEUED_BYTES, sendLargeMessagesInFragments } from '../../../lib/browsers/cdp-protocol/send-large-messages-in-fragments'

describe('sendLargeMessagesInFragments', () => {
  describe('with a stub socket', () => {
    let originalSend: Mock
    let tcpSocket: EventEmitter & { writableLength: number, writableHighWaterMark: number, destroyed: boolean }
    let client: { _ws: WebSocket }

    beforeEach(() => {
      tcpSocket = Object.assign(new EventEmitter(), { writableLength: 0, writableHighWaterMark: 16 * 1024, destroyed: false })
      // Each frame waits on the socket until the test drains it.
      originalSend = vi.fn((chunk: string | Buffer) => {
        tcpSocket.writableLength += Buffer.byteLength(chunk)
      })

      // Safe because only `send` and the TCP socket's queue state are exercised.
      client = { _ws: { send: originalSend, _socket: tcpSocket } as unknown as WebSocket }

      sendLargeMessagesInFragments(client)
    })

    const drain = () => {
      tcpSocket.writableLength = 0
      tcpSocket.emit('drain')
    }

    const drainAll = () => {
      while (tcpSocket.writableLength) {
        drain()
      }
    }

    it('sends a message of up to FRAGMENT_CHARS characters as one frame', () => {
      const callback = vi.fn()
      const message = 'a'.repeat(FRAGMENT_CHARS)

      client._ws.send(message, callback)

      expect(originalSend).toHaveBeenCalledOnce()
      expect(originalSend).toHaveBeenCalledWith(message, callback, undefined)
    })

    it.each([
      ['(data, callback)', (message: string, callback: () => void) => client._ws.send(message, callback)],
      ['(data, options, callback)', (message: string, callback: () => void) => client._ws.send(message, {}, callback)],
    ])('sends a larger message as text fragments that reassemble to it, calling back once after the last, when called as %s', (_, send) => {
      const callback = vi.fn()
      // The first cut would fall between the two halves of the surrogate pair.
      const message = `${'a'.repeat(FRAGMENT_CHARS - 1)}😀${'é'.repeat(FRAGMENT_CHARS * 4)}`

      send(message, callback)
      drainAll()

      const calls = originalSend.mock.calls
      const chunks: string[] = calls.map(([chunk]) => chunk)

      expect(calls.length).toBeGreaterThan(1)

      // One message: only the last frame sets `fin`, so Chrome joins the rest onto it.
      expect(calls.map(([, options]) => options)).toEqual([
        ...Array(calls.length - 1).fill({ fin: false }),
        { fin: true },
      ])

      // The caller hears back only once the whole message is written.
      expect(calls.map(([, , cb]) => cb)).toEqual([...Array(calls.length - 1).fill(undefined), callback])

      // No frame comes near Chrome's per-frame read cap.
      expect(chunks.every((chunk) => chunk.length <= FRAGMENT_CHARS)).toBe(true)

      // The pair stays in one fragment, so every fragment encodes to UTF-8 without loss.
      expect(chunks.every((chunk) => Buffer.from(chunk).toString('utf8') === chunk)).toBe(true)

      // Nothing is lost, duplicated or reordered.
      expect(chunks.join('')).toBe(message)
    })

    it('holds frames back while MAX_QUEUED_BYTES are waiting, then sends them in order as the socket drains', () => {
      const large = 'a'.repeat(FRAGMENT_CHARS * 16)
      const small = '{"id":2}'

      client._ws.send(large, vi.fn())
      client._ws.send(small, vi.fn())

      // Stops at the first frame that takes the queue to the limit.
      expect(originalSend).toHaveBeenCalledTimes(MAX_QUEUED_BYTES / FRAGMENT_CHARS)

      let peak = tcpSocket.writableLength

      while (tcpSocket.writableLength) {
        drain()
        peak = Math.max(peak, tcpSocket.writableLength)
      }

      expect(peak).toBeLessThanOrEqual(MAX_QUEUED_BYTES)

      const chunks: string[] = originalSend.mock.calls.map(([chunk]) => chunk)

      expect(chunks.at(-1)).toBe(small)
      expect(chunks.slice(0, -1).join('')).toBe(large)
    })

    it('counts the next frame toward MAX_QUEUED_BYTES before sending it', () => {
      // 3 bytes of UTF-8 each, so every fragment is 3 MiB.
      client._ws.send('€'.repeat(FRAGMENT_CHARS * 3))

      expect(originalSend).toHaveBeenCalledOnce()

      let peak = tcpSocket.writableLength

      while (tcpSocket.writableLength) {
        drain()
        peak = Math.max(peak, tcpSocket.writableLength)
      }

      expect(originalSend).toHaveBeenCalledTimes(3)
      expect(peak).toBeLessThanOrEqual(MAX_QUEUED_BYTES)
    })

    it('sends a frame larger than MAX_QUEUED_BYTES while the socket is under its high water mark, since no drain would follow', () => {
      const frame = Buffer.alloc(MAX_QUEUED_BYTES + 1)

      tcpSocket.writableLength = tcpSocket.writableHighWaterMark - 1
      client._ws.send(frame)

      expect(originalSend).toHaveBeenCalledOnce()
      expect(originalSend.mock.calls[0][0]).toBe(frame)
    })

    it('fails the held messages once the socket closes, calling each callback once without writing their frames', () => {
      const large = vi.fn()
      const small = vi.fn()

      client._ws.send('a'.repeat(FRAGMENT_CHARS * 16), large)
      client._ws.send('{"id":2}', small)

      tcpSocket.destroyed = true
      tcpSocket.emit('close')

      expect(originalSend).toHaveBeenCalledTimes(MAX_QUEUED_BYTES / FRAGMENT_CHARS)

      for (const callback of [large, small]) {
        expect(callback).toHaveBeenCalledOnce()
        expect(callback).toHaveBeenCalledWith(expect.objectContaining({ message: 'The CDP websocket closed before the message was sent' }))
      }
    })

    it('fails a message whose held frame throws, and keeps sending the next one', () => {
      const failing = vi.fn()
      const next = vi.fn()
      const sendError = new Error('WebSocket is not open: readyState 0 (CONNECTING)')

      client._ws.send('a'.repeat(FRAGMENT_CHARS * 8), failing)
      client._ws.send('{"id":2}', next)

      originalSend.mockImplementationOnce(() => {
        throw sendError
      })

      expect(drainAll).not.toThrow()

      expect(failing).toHaveBeenCalledOnce()
      expect(failing).toHaveBeenCalledWith(sendError)
      expect(originalSend.mock.calls.at(-1)).toEqual(['{"id":2}', next, undefined])
    })
  })

  it('fragments without holding frames back when the websocket has no TCP socket', () => {
    const originalSend = vi.fn()
    // Safe because only `send` is exercised.
    const client = { _ws: { send: originalSend } as unknown as WebSocket }

    sendLargeMessagesInFragments(client)
    client._ws.send('a'.repeat(FRAGMENT_CHARS * 8))

    expect(originalSend).toHaveBeenCalledTimes(8)
  })

  it('leaves a client without a socket untouched', () => {
    expect(() => sendLargeMessagesInFragments({})).not.toThrow()
  })

  // Covers what the stub socket tests can't: that chrome-remote-interface still
  // keeps its socket on `_ws` and ws its TCP socket on `_socket`, that its ws
  // version joins the fragments into one text message, and that a real socket
  // drains the held frames.
  describe('with a real chrome-remote-interface client', () => {
    let server: WebSocket.Server
    let received: { isText: boolean, message: { id: number, method: string, params: Record<string, unknown> } }[]
    let cdpClient: CDP.Client
    let peers: { socket: WebSocket, tcpSocket: Socket }[]

    beforeEach(async () => {
      received = []
      peers = []
      server = new WebSocket.Server({ host: '127.0.0.1', port: 0 })

      server.on('connection', (socket, request) => {
        peers.push({ socket, tcpSocket: request.socket })
        socket.on('message', (data, isBinary) => {
          const message = JSON.parse(String(data))

          // ws 5 delivers a text message as a string and passes no `isBinary`;
          // ws 8 delivers a Buffer and passes `isBinary`.
          received.push({ isText: typeof data === 'string' || isBinary === false, message })
          socket.send(JSON.stringify({ id: message.id, result: {} }))
        })
      })

      await once(server, 'listening')

      const { port } = server.address() as AddressInfo

      cdpClient = await CDP({ target: `ws://127.0.0.1:${port}`, local: true })
    })

    afterEach(async () => {
      await cdpClient.close()
      server.close()
    })

    it('sends a larger message as fragments that the server receives as one message', async () => {
      // Safe because the next assertion fails the test if the field is gone.
      const socket = (cdpClient as unknown as { _ws?: WebSocket })._ws

      expect(socket, 'chrome-remote-interface socket on `_ws`').toBeDefined()

      // Safe because the next assertion fails the test if the field is gone.
      const tcpSocket = (socket as unknown as { _socket?: Socket })._socket

      expect(tcpSocket, 'ws TCP socket on `_socket`').toBeDefined()

      const write = socket!.send.bind(socket!)
      let peak = 0
      const frames = vi.spyOn(socket!, 'send').mockImplementation((...args: Parameters<WebSocket['send']>) => {
        write(...args)
        peak = Math.max(peak, tcpSocket!.writableLength)
      })
      const body = 'a'.repeat(FRAGMENT_CHARS * 64)

      sendLargeMessagesInFragments(cdpClient)

      await cdpClient.send('Fetch.fulfillRequest', { requestId: 'large', responseCode: 200, body })
      await cdpClient.send('Fetch.continueRequest', { requestId: 'small' })

      expect(frames.mock.calls.length).toBeGreaterThan(2)
      // ws writes a header of a few bytes ahead of each frame's payload.
      expect(peak).toBeLessThanOrEqual(MAX_QUEUED_BYTES + 1024)
      // CDP only accepts text messages.
      expect(received.map(({ isText, message }) => [message.method, message.params.requestId, isText])).toEqual([
        ['Fetch.fulfillRequest', 'large', true],
        ['Fetch.continueRequest', 'small', true],
      ])

      expect(received[0].message.params.body === body, 'received body equals the sent one').toBe(true)
    }, 30_000)

    it('rejects a command whose frames are still held when the connection closes', async () => {
      // The server stops reading, so frames back up on the client until it closes.
      peers[0].tcpSocket.pause()

      sendLargeMessagesInFragments(cdpClient)

      const sent = cdpClient.send('Fetch.fulfillRequest', { requestId: 'large', responseCode: 200, body: 'a'.repeat(FRAGMENT_CHARS * 64) })

      peers[0].socket.terminate()

      await expect(sent).rejects.toThrow('The CDP websocket closed before the message was sent')
    }, 30_000)
  })
})
