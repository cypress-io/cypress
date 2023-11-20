import {
  getCtx,
  registerServerPluginHandler,
} from '@packages/data-context'

export const registerEvent = (event, callback) => {
  getCtx().lifecycleManager.registerEvent(event, callback)
}

export const getPluginPid = () => {
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

// for testing purposes
export const _reset = () => {
  return getCtx().lifecycleManager.reinitializeCypress()
}
