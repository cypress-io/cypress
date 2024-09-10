import { Socket } from 'socket.io-client'
import { CDPBrowserSocket } from './cdp-browser'

export type SocketShape = Socket | CDPBrowserSocket
