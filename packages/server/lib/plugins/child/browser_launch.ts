import * as util from '../util'
import type { PluginChildIpc, PluginInvokeIds } from './types'

export const wrapBefore = (
  ipc: PluginChildIpc,
  invoke: (eventId: number, args?: any[]) => any,
  ids: PluginInvokeIds,
  args: any[],
): void => {
  util.wrapChildPromise(ipc, invoke, ids, args)
}
