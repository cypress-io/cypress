import debugFn from 'debug'
import type { ViteDevServerConfig } from './devServer'

const debug = debugFn('cypress:vite-dev-server:getVite')

export type Vite = typeof import('vite-6')

// "vite-dev-server" is bundled in the binary, so we need to require.resolve "vite"
// from root of the active project since we don't bundle vite internally but rather
// use the version the user has installed
export function getVite (config: ViteDevServerConfig): Vite {
  try {
    const viteImportPath = require.resolve('vite', { paths: [config.cypressConfig.projectRoot] })

    debug('resolved viteImportPath as %s', viteImportPath)

    return require(viteImportPath)
  } catch (err) {
    throw new Error(`Could not find "vite" in your project's dependencies. Please install "vite" to fix this error.\n\n${err}`)
  }
}
