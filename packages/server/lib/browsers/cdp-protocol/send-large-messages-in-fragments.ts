import Debug from 'debug'
import type { Socket } from 'net'
import type WebSocket from 'ws'

const debug = Debug('cypress:server:browsers:cdp-protocol:send-large-messages-in-fragments')

// In UTF-16 code units, so a fragment is at most 3 MiB of UTF-8. Chrome closes
// a DevTools websocket when one frame overflows its 100 MiB read buffer, and
// takes in small fragments faster than a few large ones.
export const FRAGMENT_CHARS = 1024 * 1024

// Node joins every chunk waiting on a socket into one write, and Windows can
// fail a write of tens of MB with ENOBUFS, which closes the connection. Frames
// are held back while this much is waiting, so no write grows past a few MiB.
export const MAX_QUEUED_BYTES = 4 * 1024 * 1024

type SendCallback = (err?: Error) => void

// A string stores a character above U+FFFF, such as most emoji, as two UTF-16
// units, and this range is always the first of them. ws encodes each fragment
// to UTF-8 on its own, so a fragment ending on this unit would split the pair,
// and each half would encode as U+FFFD.
const isHighSurrogate = (charCode: number) => charCode >= 0xd800 && charCode <= 0xdbff

/**
 * Patches a chrome-remote-interface client to send messages longer than
 * FRAGMENT_CHARS as fragments, and to hold frames back while MAX_QUEUED_BYTES
 * are waiting to be written. Call once, right after connecting.
 */
export function sendLargeMessagesInFragments (client: object): void {
  // Safe because chrome-remote-interface keeps its socket on the undeclared
  // `_ws` field, and ws keeps the TCP socket on `_socket`. A client without
  // one, such as a test double, is left as is.
  const ws = (client as { _ws?: WebSocket & { _socket?: Socket } })._ws

  if (!ws) {
    debug('client has no socket, so messages longer than %d characters will not be fragmented', FRAGMENT_CHARS)

    return
  }

  // Bound copy of the original, so the override can write without calling itself.
  const send = ws.send.bind(ws)
  const socket = ws._socket

  if (!socket) {
    debug('websocket has no TCP socket, so frames will not be held back')
  }

  const frames: (() => void)[] = []

  const flush = () => {
    while (frames.length && (!socket || socket.destroyed || socket.writableLength < MAX_QUEUED_BYTES)) {
      frames.shift()!()
    }
  }

  socket?.on('drain', flush)
  // Sending on a closed websocket calls back with an error, which rejects the
  // CDP command instead of leaving it pending.
  socket?.on('close', flush)

  // `ws.send` takes `(data, callback)` or `(data, options, callback)`.
  ws.send = (data: any, optionsOrCallback?: any, callback?: SendCallback) => {
    if (typeof data !== 'string' || data.length <= FRAGMENT_CHARS) {
      frames.push(() => send(data, optionsOrCallback, callback))

      return flush()
    }

    const done: SendCallback | undefined = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback

    // Slicing the string lets ws encode and mask each fragment in place,
    // without a copy of the whole message. Frames leave the queue in order, so
    // no other message lands between fragments.
    for (let start = 0; start < data.length;) {
      let end = Math.min(start + FRAGMENT_CHARS, data.length)

      if (end < data.length && isHighSurrogate(data.charCodeAt(end - 1))) {
        end--
      }

      const fin = end === data.length
      const fragment = data.slice(start, end)

      frames.push(() => send(fragment, { fin }, fin ? done : undefined))
      start = end
    }

    flush()
  }
}
