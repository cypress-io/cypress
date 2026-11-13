import Debug from 'debug'
import type WebSocket from 'ws'

const debug = Debug('cypress:server:browsers:cdp-protocol:send-large-messages-in-fragments')

// Chrome closes a DevTools websocket, and everything on it, when its 100 MiB
// read buffer overflows, but it reassembles fragmented messages. That buffer
// can also hold bytes that arrived after the frame being read, so the threshold
// leaves room under the cap. Smaller messages are sent as a single frame.
export const FRAGMENT_MESSAGES_OVER_BYTES = 64 * 1024 * 1024

// In UTF-16 code units, so a fragment is at most 3 MiB of UTF-8. Chrome takes
// in small fragments faster than a few large ones.
export const FRAGMENT_CHARS = 1024 * 1024

type SendCallback = (err?: Error) => void

// A string stores a character above U+FFFF, such as most emoji, as two UTF-16
// units, and this range is always the first of them. ws encodes each fragment
// to UTF-8 on its own, so a fragment ending on this unit would split the pair,
// and each half would encode as U+FFFD.
const isHighSurrogate = (charCode: number) => charCode >= 0xd800 && charCode <= 0xdbff

/**
 * Patches a chrome-remote-interface client to send messages larger than
 * FRAGMENT_MESSAGES_OVER_BYTES as fragments. Call once, right after connecting.
 */
export function sendLargeMessagesInFragments (client: object): void {
  // Safe because chrome-remote-interface keeps its socket on the undeclared
  // `_ws` field. A client without one, such as a test double, is left as is.
  const ws = (client as { _ws?: WebSocket })._ws

  if (!ws) {
    debug('client has no socket, so messages over %d bytes will not be fragmented', FRAGMENT_MESSAGES_OVER_BYTES)

    return
  }

  // Bound copy of the original, so the override can write without calling itself.
  const send = ws.send.bind(ws)

  // `ws.send` takes `(data, callback)` or `(data, options, callback)`.
  ws.send = (data: any, optionsOrCallback?: any, callback?: SendCallback) => {
    if (typeof data !== 'string' || Buffer.byteLength(data) <= FRAGMENT_MESSAGES_OVER_BYTES) {
      return send(data, optionsOrCallback, callback)
    }

    const done: SendCallback | undefined = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback

    // Slicing the string lets ws encode and mask each fragment in place,
    // without a copy of the whole message. The loop is synchronous, so no other
    // frame lands between fragments.
    for (let start = 0; start < data.length;) {
      let end = Math.min(start + FRAGMENT_CHARS, data.length)

      if (end < data.length && isHighSurrogate(data.charCodeAt(end - 1))) {
        end--
      }

      const fin = end === data.length

      send(data.slice(start, end), { fin }, fin ? done : undefined)
      start = end
    }
  }
}
