import { EventEmitter } from 'events'
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
            'import.meta.env.__cypress_supportPath': JSON.stringify(resolve(projectRoot, supportFilePath)),
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
        {
          tag: 'script',
          attrs: { type: 'module', src: INIT_FILEPATH },
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
