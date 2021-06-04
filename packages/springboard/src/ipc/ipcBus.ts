import { EventEmitter } from 'events'
import { ipcBus } from './index'

interface IpcResponseMeta {
  ports: number[]
  sender: EventEmitter
  senderId: number
}

/**
 * Electron IPC returns itself (an EventEmitter) as the first argument,
 * and the payload as the second.
 * packages/server responds to *every* event with 'response'
 * This is a wrapper to make usage a bit more ergonomic and type safe.
 *
 * packages/server should respond with the following signature:
 * return sendResponse({ type: 'success', event: 'get:package-manager', data: pkg })
 */
window.ipc.on('response', <P extends { event: string }>(_meta: IpcResponseMeta, payload: P) => {
  ipcBus.emit(payload.event, payload)
})

type EventMap = Record<string, any>
type EventKey<T extends EventMap> = string & keyof T
type EventReceiver<T> = (...params: T[]) => void

export class IpcBus<S extends EventMap, T extends EventMap> {
  private listeners: Record<string, Array<(...args: unknown[]) => void>> = {}

  emit (key: string, ...args: unknown[]) {
    if (!this.listeners[key]) {
      return
    }

    this.listeners[key].forEach((fn) => fn(...args))
  }

  send<K extends EventKey<S>> (key: K, payload: S[K]) {
    window.ipc.send('request', Math.random(), key, payload)
  }

  on<K extends EventKey<T>> (key: K, fn: EventReceiver<T[K]>) {
    this.listeners[key] = (this.listeners[key] || []).concat(fn)
  }
}
