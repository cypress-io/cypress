import { EventEmitter } from 'events'

export interface IpcResponseMeta {
  ports: number[]
  sender: EventEmitter
  senderId: number
}

type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

interface Emitter<S extends EventMap, T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  send<K extends EventKey<S>>(eventName: K, params: S[K]): void;
}

export class IpcBus<S extends EventMap, T extends EventMap> implements Emitter<S, T> {
  private ipc = window.ipc

  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    this.ipc.on(eventName, fn);
  }

  send<K extends EventKey<T>>(eventName: K, params: S[K]): void {
    this.ipc.send('request', Math.random(), eventName, params);
  }
}
