import { resolve } from 'path'
import { readFile } from 'fs'
import { promisify } from 'util'
import { Plugin, ViteDevServer } from 'vite'

const read = promisify(readFile)

const pluginName = 'cypress-transform-html'

const INIT_FILEPATH = resolve(__dirname, '../client/initCypressTests.js')

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  devServerEvents: EventEmitter,
): Plugin => {
  let base = '/'

  return {
    name: pluginName,
    enforce: 'pre',
    config (_, env) {
      if (env) {
        return {
          define: {
            'import.meta.env.__cypress_supportPath': JSON.stringify(supportFilePath ? resolve(projectRoot, supportFilePath) : undefined),
            'import.meta.env.__cypress_originAutUrl': JSON.stringify('__cypress/iframes/'),
          },
        }
      }
    },
    configResolved (config) {
      base = config.base
    },
    transformIndexHtml () {
      return [
        // load the script at the end of the body
        // script has to be loaded when the vite client is connected
        {
          tag: 'script',
          injectTo: 'body',
          attrs: { type: 'module' },
          children: `import(${JSON.stringify(INIT_FILEPATH)})`,
        },
      ]
    },
    configureServer: async (server: ViteDevServer) => {
      const indexHtml = await read(resolve(__dirname, '..', 'index.html'), { encoding: 'utf8' })

      const transformedIndexHtml = await server.transformIndexHtml(base, indexHtml)

      server.middlewares.use(`${base}index.html`, (req, res) => res.end(transformedIndexHtml))
    },
    handleHotUpdate: () => {
      // restart tests when code is updated
      devServerEvents.emit('dev-server:compile:success')

      return []
    },
  }
}
