import debugFn from 'debug'
import type { PluginOption } from 'vite'

const debug = debugFn('cypress:vite-dev-server:plugins:inspect')

console.log('anything')
export const CypressInspect = (): (() => PluginOption) | null => {
  if (!process.env.DEBUG) return null

  let Inspect

  try {
    Inspect = require('vite-plugin-inspect').default
    debug('inspect was found', Inspect)
  } catch (err) {
    debug(`Tried to import the inspect plugin 'vite-plugin-inspect'. It's an optional peerDependency so install it if you'd like.`)
    debug(err)

    return null
  }

  return () => {
    return {
      ...Inspect(),
      name: 'cypress:inspect',
    }
  }
}
