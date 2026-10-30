import _ from 'lodash'
import * as util from '../util'
import type { PluginChildIpc, PluginEventHandler, PluginInvokeIds } from './types'

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
const mergeLaunchOptions = (launchOptions: Record<string, any>, result: Record<string, any>) => {
  const merged = { ...launchOptions }

  _.forEach(result, (value, key) => {
    if (!value) {
      return
    }

    merged[key] = _.isPlainObject(launchOptions[key]) ? { ...launchOptions[key], ...value } : value
  })

  return merged
}

export const chainBefore = (first: PluginEventHandler, second: PluginEventHandler): PluginEventHandler => {
  return async (browser, launchOptions) => {
    const firstResult = await first(browser, launchOptions)
    const options = firstResult ? mergeLaunchOptions(launchOptions, firstResult) : launchOptions
    const secondResult = await second(browser, options)

    if (secondResult) {
      return mergeLaunchOptions(options, secondResult)
    }

    // Returning nothing tells the server to keep its own launch options
    return firstResult ? options : undefined
  }
}
