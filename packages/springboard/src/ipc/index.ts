import { IpcBus, IpcResponseMeta } from './ipcBus'

interface IpcSendEvents {
  'get:package-manager': undefined
}

interface IpcReceiveEvent<Data> {
  status: 'success' | 'error'
  data: Data
}

interface IpcReceiveEvents {
  'response'
  'get:package-manager': (
    meta: IpcResponseMeta, 
    payload: IpcReceiveEvent<{ data: 'yarn' | 'npm' }>
  ) => any
}


