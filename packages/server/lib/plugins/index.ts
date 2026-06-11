import {
  getCtx,
  hasCtx,
  registerServerPluginHandler,
} from '@packages/data-context'

export const registerEvent = (event, callback) => {
  getCtx().lifecycleManager.registerEvent(event, callback)
}

export const getPluginPid = () => {
  // The process profiler runs on its own interval timer and can call this
  // outside of the DataContext lifecycle - before `setCtx` has run or after
  // the context has been torn down (e.g. between specs in CI). In that case
  // there is no plugin process to report, so avoid throwing from `getCtx`.
  if (!hasCtx()) {
    return undefined
  }

  return getCtx().lifecycleManager.eventProcessPid
}

export const registerHandler = (handler) => {
  registerServerPluginHandler(handler)
}

export const has = (event) => {
  return getCtx().lifecycleManager.hasNodeEvent(event)
}

export const execute = (event, ...args) => {
  return getCtx().lifecycleManager.executeNodeEvent(event, args)
}
