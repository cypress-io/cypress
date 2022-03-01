import debugFn from 'debug'
import type { PluginOption } from 'vite'

const debug = debugFn('cypress:vite-dev-server:plugins:inspect')

console.log('anything')
const noop = () => ({})

export const CypressInspect = (): PluginOption => {
  if (!process.env.DEBUG) return noop

  let Inspect = noop

  try {
    Inspect = require('vite-plugin-inspect').default
    debug('inspect was found', Inspect)
  } catch (err) {
    debug(`Tried to import the inspect plugin 'vite-plugin-inspect'. It's an optional peerDependency so install it if you'd like.`)
    debug(err)

    return noop
  }

  return () => {
    return {
      ...Inspect(),
      name: 'cypress:inspect',
    }
  }
}
