import type { Socket } from 'socket.io-client'
import type { CDPBrowserSocket } from './cdp-browser'

export type SocketShape = Socket | CDPBrowserSocket
