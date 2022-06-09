import debugFn from 'debug'
import type { PluginOption } from 'vite'
import type { ViteDevServerConfig } from '../devServer'

const debug = debugFn('cypress:vite-dev-server:plugins:inspect')

export const CypressInspect = (config: ViteDevServerConfig): PluginOption | null => {
  if (!process.env.CYPRESS_INTERNAL_VITE_INSPECT) {
    debug('skipping vite inspect because CYPRESS_INTERNAL_VITE_INSPECT is not set')

    return null
  }

  let Inspect

  try {
    const inspectPluginPath = require.resolve('vite-plugin-inspect', { paths: [config.cypressConfig.projectRoot] })

    const inspectModule = require(inspectPluginPath)

    Inspect = inspectModule.default ?? inspectModule
    debug('inspect was found', Inspect)
  } catch (err) {
    debug(`Tried to import the inspect plugin 'vite-plugin-inspect'. It's an optional peerDependency so install it if you'd like.`)
    debug(err)

    return null
  }

  return {
    ...Inspect(),
    name: 'cypress:inspect',
  }
}
