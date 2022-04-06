import debugFn from 'debug'
import type { PluginOption } from 'vite'

const debug = debugFn('cypress:vite-dev-server:plugins:inspect')

export const CypressInspect = async (): Promise<PluginOption | null> => {
  if (!process.env.CYPRESS_INTERNAL_VITE_INSPECT) {
    debug('skipping vite inspect because CYPRESS_INTERNAL_VITE_INSPECT is not set')

    return null
  }

  let Inspect

  try {
    Inspect = (await import('vite-plugin-inspect')).default
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
