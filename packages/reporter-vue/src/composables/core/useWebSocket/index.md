---
category: Misc
---

# useWebSocket

Reactive [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket) client.

## Usage

```js
import { useWebSocket } from '@vueuse/core'

const { status, data, send, open, close } = useWebSocket('ws://websocketurl')
```

See the [Type Declarations](#type-declarations) for more options.

### Immediate

Auto connect (enabled by default).

This will call `open()` automatically for you and you don't need to call it by yourself.

### Auto-reconnection

Reconnect on errors automatically (disabled by default).

```js
const { status, data, close } = useWebSocket('ws://websocketurl', {
  autoReconnect: true,
})
```

Or with more controls over its behavior:

```js
const { status, data, close } = useWebSocket('ws://websocketurl', {
  autoReconnect: {
    retries: 3,
    delay: 1000,
    onFailed() {
      alert('Failed to connect WebSocket after 3 retires')
    },
  },
})
```

Explicitly calling `close()` won't trigger the auto reconnection.

### Heartbeat

It's common practice to send a small message (heartbeat) for every given time passed to keep the connection active. In this function we provide a connivent helper to do it:

```js
const { status, data, close } = useWebSocket('ws://websocketurl', {
  heartbeat: true,
})
```

Or with more controls:

```js
const { status, data, close } = useWebSocket('ws://websocketurl', {
  heartbeat: {
    message: 'ping',
    interval: 1000,
  },
})
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type WebSocketStatus = "OPEN" | "CONNECTING" | "CLOSED"
export interface WebSocketOptions {
  onConnected?: (ws: WebSocket) => void
  onDisconnected?: (ws: WebSocket, event: CloseEvent) => void
  onError?: (ws: WebSocket, event: Event) => void
  onMessage?: (ws: WebSocket, event: MessageEvent) => void
  /**
   * Send heartbeat for every x milliseconds passed
   *
   * @default false
   */
  heartbeat?:
    | boolean
    | {
        /**
         * Message for the heartbeat
         *
         * @default 'ping'
         */
        message?: string
        /**
         * Interval, in milliseconds
         *
         * @default 1000
         */
        interval?: number
      }
  /**
   * Enabled auto reconnect
   *
   * @default false
   */
  autoReconnect?:
    | boolean
    | {
        /**
         * Maximum retry times.
         *
         * @default -1
         */
        retries?: number
        /**
         * Delay for reconnect, in milliseconds
         *
         * @default 1000
         */
        delay?: number
        /**
         * On maximum retry times reached.
         */
        onFailed?: Fn
      }
  /**
   * Automatically open a connection
   *
   * @default true
   */
  immediate?: boolean
}
export interface WebSocketResult<T> {
  /**
   * Reference to the latest data received via the websocket,
   * can be watched to respond to incoming messages
   */
  data: Ref<T | null>
  /**
   * The current websocket status, can be only one of:
   * 'OPEN', 'CONNECTING', 'CLOSED'
   */
  status: Ref<WebSocketStatus>
  /**
   * Closes the websocket connection gracefully.
   */
  close: WebSocket["close"]
  /**
   * Reopen the websocket connection.
   * If there the current one is active, will close it before opening a new one.
   */
  open: Fn
  /**
   * Sends data through the websocket connection.
   *
   * @param data
   * @param useBuffer when the socket is not yet open, store the data into the buffer and sent them one connected. Default to true.
   */
  send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean
  /**
   * Reference to the WebSocket instance.
   */
  ws: Ref<WebSocket | undefined>
}
/**
 * Reactive WebSocket client.
 *
 * @see https://vueuse.org/useWebSocket
 * @param url
 */
export declare function useWebSocket<Data = any>(
  url: string,
  options?: WebSocketOptions
): WebSocketResult<Data>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useWebSocket/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useWebSocket/index.md)


<!--FOOTER_ENDS-->
