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

  devServerEvents.on('dev-server:compile:success', ({ specFile, jitRecompile, jitRecompileGeneration }: { specFile?: string, jitRecompile?: boolean, jitRecompileGeneration?: number } = {}) => {
    ipc.send('dev-server:compile:success', { specFile, jitRecompile, jitRecompileGeneration })
  })

  devServerEvents.on('dev-server:jit-recompile:queued', (data: { generation: number }) => {
    ipc.send('dev-server:jit-recompile:queued', data)
  })

  devServerEvents.on('dev-server:specs:unchanged', () => {
    ipc.send('dev-server:specs:unchanged')
  })

  options.devServerEvents = devServerEvents

  util.wrapChildPromise(ipc, invoke, ids, args)
}
