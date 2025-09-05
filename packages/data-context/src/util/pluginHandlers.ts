import type { PluginIpcHandler } from '../data'

let pluginHandlers: PluginIpcHandler[] = []

export const getServerPluginHandlers = () => {
  return pluginHandlers
}

export const registerServerPluginHandler = (handler: PluginIpcHandler) => {
  pluginHandlers.push(handler)
}

export const resetPluginHandlers = () => {
  pluginHandlers = []
}
