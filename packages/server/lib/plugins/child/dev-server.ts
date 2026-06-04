import EE from 'events'
import * as util from '../util'
import type { PluginChildIpc, PluginInvokeIds } from './types'

export const wrap = (
  ipc: PluginChildIpc,
  invoke: (eventId: number, args?: any[]) => any,
  ids: PluginInvokeIds,
  args: any[],
): void => {
  const [options] = args
  const devServerEvents = new EE()

  ipc.on('dev-server:specs:changed', (specsAndOptions) => {
    devServerEvents.emit('dev-server:specs:changed', specsAndOptions)
  })

  devServerEvents.on('dev-server:compile:success', ({ specFile }: { specFile?: string } = {}) => {
    ipc.send('dev-server:compile:success', { specFile })
  })

  options.devServerEvents = devServerEvents

  util.wrapChildPromise(ipc, invoke, ids, args)
}
