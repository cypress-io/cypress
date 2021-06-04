import { IpcBus } from '../ipc/ipcBus'
import { useStore } from '../store'

interface ReceiveEvents {
  'get:package-manager': {
    data: 'yarn' | 'npm'
    type: 'success' | 'error'
  }
}

interface SendEvents {
  'get:package-manager': undefined
}

export const ipcBus = new IpcBus<SendEvents, ReceiveEvents>()

ipcBus.on('get:package-manager', (payload) => {
  useStore().setPackageManager(payload.data)
})
