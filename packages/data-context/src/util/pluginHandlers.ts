import type { IpcHandler } from '../data'

let pluginHandlers: IpcHandler[] = []

export const getServerPluginHandlers = () => {
  return pluginHandlers
}

export const registerServerPluginHandler = (handler: IpcHandler) => {
  pluginHandlers.push(handler)
}

export const resetPluginHandlers = () => {
  pluginHandlers = []
}
