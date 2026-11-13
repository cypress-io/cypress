import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { once } from 'events'
import type { AddressInfo } from 'net'
import CDP from 'chrome-remote-interface'
import WebSocket from 'ws'
import { FRAGMENT_CHARS, FRAGMENT_MESSAGES_OVER_BYTES, sendLargeMessagesInFragments } from '../../../lib/browsers/cdp-protocol/send-large-messages-in-fragments'

describe('sendLargeMessagesInFragments', () => {
  describe('with a stub socket', () => {
    let originalSend: Mock
    let client: { _ws: WebSocket }

    beforeEach(() => {
      originalSend = vi.fn()
      // Safe because only `send` is exercised.
      client = { _ws: { send: originalSend } as unknown as WebSocket }

      sendLargeMessagesInFragments(client)
    })

    it('sends a message up to the fragmenting threshold unchanged', () => {
      const callback = vi.fn()
      const message = 'a'.repeat(FRAGMENT_MESSAGES_OVER_BYTES)

      client._ws.send(message, callback)

      expect(originalSend).toHaveBeenCalledOnce()
      expect(originalSend).toHaveBeenCalledWith(message, callback, undefined)
    })

    it.each([
      ['(data, callback)', (message: string, callback: () => void) => client._ws.send(message, callback)],
      ['(data, options, callback)', (message: string, callback: () => void) => client._ws.send(message, {}, callback)],
    ])('sends a larger message as text fragments that reassemble to it, calling back once after the last, when called as %s', (_, send) => {
      const callback = vi.fn()
      // Its byte length is over the threshold but its string length is not, and
      // the first cut would fall between the two halves of the surrogate pair.
      const message = `${'a'.repeat(FRAGMENT_CHARS - 1)}😀${'é'.repeat(FRAGMENT_MESSAGES_OVER_BYTES / 2)}`

      send(message, callback)

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
  })

  it('leaves a client without a socket untouched', () => {
    expect(() => sendLargeMessagesInFragments({})).not.toThrow()
  })

  // Covers what the stub socket tests can't: that chrome-remote-interface still
  // keeps its socket on `_ws`, and that its ws version joins the fragments into
  // one text message.
  describe('with a real chrome-remote-interface client', () => {
    let server: WebSocket.Server
    let received: { isText: boolean, message: { id: number, method: string, params: Record<string, unknown> } }[]
    let cdpClient: CDP.Client

    beforeEach(async () => {
      received = []
      server = new WebSocket.Server({ host: '127.0.0.1', port: 0 })

      server.on('connection', (socket) => {
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

      const frames = vi.spyOn(socket!, 'send')
      const body = 'a'.repeat(FRAGMENT_MESSAGES_OVER_BYTES)

      sendLargeMessagesInFragments(cdpClient)

      await cdpClient.send('Fetch.fulfillRequest', { requestId: 'large', responseCode: 200, body })
      await cdpClient.send('Fetch.continueRequest', { requestId: 'small' })

      expect(frames.mock.calls.length).toBeGreaterThan(2)
      // CDP only accepts text messages.
      expect(received.map(({ isText, message }) => [message.method, message.params.requestId, isText])).toEqual([
        ['Fetch.fulfillRequest', 'large', true],
        ['Fetch.continueRequest', 'small', true],
      ])

      expect(received[0].message.params.body === body, 'received body equals the sent one').toBe(true)
    }, 30_000)
  })
})
