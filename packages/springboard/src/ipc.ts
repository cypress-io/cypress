// stub out for the purpose of testing - window.ipc
// does not exist in the iframe.
// @ts-ignore
const ipc = window.ipc ? window.ipc : {
  on () {},
  send () {},
}

class IpcBus {
  private listeners: Record<string, Array<(...args: unknown[]) => void>> = {}

  emit (key: string, ...args: unknown[]) {
    if (!this.listeners[key]) {
      return
    }

    this.listeners[key].forEach((fn) => fn(...args))
  }

  send (key: string, payload: any) {
    ipc.send('request', Math.random(), key, payload)
  }

  on (key: string, fn: (...args: unknown[]) => any) {
    this.listeners[key] = (this.listeners[key] || []).concat(fn)
  }
}

export const ipcBus = new IpcBus()

ipc.on('response', (_meta: any, payload: any) => {
  ipcBus.emit(payload.type, payload)
})