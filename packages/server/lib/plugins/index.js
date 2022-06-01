const { getCtx, registerServerPluginHandler, getServerPluginHandlers: getPluginHandlers } = require('@packages/data-context')

const registerEvent = (event, callback) => {
  getCtx().lifecycleManager.registerEvent(event, callback)
}

const getPluginPid = () => {
  return getCtx().lifecycleManager.eventProcessPid
}

const registerHandler = (handler) => {
  registerServerPluginHandler(handler)
}

const getServerPluginHandlers = () => {
  return getPluginHandlers()
}

const has = (event) => {
  return getCtx().lifecycleManager.hasNodeEvent(event)
}

const execute = (event, ...args) => {
  return getCtx().lifecycleManager.executeNodeEvent(event, args)
}

const _reset = () => {
  return getCtx().lifecycleManager.reinitializeCypress()
}

module.exports = {
  getPluginPid,
  execute,
  has,
  registerEvent,
  registerHandler,
  getServerPluginHandlers,

  // for testing purposes
  _reset,
}
