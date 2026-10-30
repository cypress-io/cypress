import _ from 'lodash'
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

// Applies a handler's result the way the server applies the final one, so a
// handler that returns only some properties leaves the rest in place for the
// handlers after it
export const mergeLaunchOptions = (launchOptions: Record<string, any>, result: Record<string, any> | undefined) => {
  if (!result) {
    return undefined
  }

  const merged = { ...launchOptions }

  _.forEach(result, (value, key) => {
    if (!value) {
      return
    }

    merged[key] = _.isPlainObject(launchOptions[key]) ? { ...launchOptions[key], ...value } : value
  })

  return merged
}
