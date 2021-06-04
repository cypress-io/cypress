import { EventEmitter } from 'events'

interface IpcResponseMeta {
  ports: number[]
  sender: EventEmitter
  senderId: number
}

window.ipc.on('response', <P extends { event: string }>(_meta: IpcResponseMeta, payload: P) => {
  ipcBus.emit(payload.event, payload)
})

type EventMap = Record<string, any>
type EventKey<T extends EventMap> = string & keyof T
type EventReceiver<T> = (...params: T[]) => void

interface Emitter<S extends EventMap, T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
  send<K extends EventKey<T>>(eventName: K, params: S[K]): void
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void
}

class Emitter<S extends EventMap, T extends EventMap> {
  private listeners: Record<string, Array<(...args: unknown[]) => void>> = {}

  emit(key: string, ...args: unknown[]) {
    if (!this.listeners[key]) {
      return
    }

    this.listeners[key].forEach(fn => fn(...args))
  }

  send<K extends EventKey<S>>(key: K, payload: S[K]) {
    window.ipc.send('request', Math.random(), key, payload)
  }

  on<K extends EventKey<T>>(key: K, fn: EventReceiver<T[K]>) {
    this.listeners[key] = (this.listeners[key] || []).concat(fn)
  }
}

interface SendEvents {
  'get:package-manager': undefined
}

interface ReceiveEvents {
  'get:package-manager': { 
    data: string 
    type: 'success' | 'error'
  }
}

export const ipcBus = new Emitter<SendEvents, ReceiveEvents>()

ipcBus.on('get:package-manager', (payload) => {
})