import { EventEmitter } from 'events'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { Plugin } from 'vite'
import { render } from 'mustache'

const pluginName = 'cypress-transform-html'

const INDEX_FILEPATH = resolve(__dirname, '../client/index.html')
const INIT_FILEPATH = resolve(__dirname, '../client/initCypressTests.js')

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  devServerEvents: EventEmitter,
): Plugin => {
  return {
    name: pluginName,
    enforce: 'pre',
    configureServer (server) {
      server.middlewares.use('/index.html', async (req, res) => {
        let html = readFileSync(INDEX_FILEPATH, 'utf-8')

        html = await server.transformIndexHtml(req.url, html)
        html = render(html, {
          specPath: `/${req.headers.__cypress_spec_path}`,
          supportFilePath: resolve(projectRoot, supportFilePath),
        })

        res.setHeader('Content-Type', 'text/html')
        res.setHeader('Cache-Control', 'no-cache')

        return res.end(html)
      })
    },
    transformIndexHtml () {
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: readFileSync(INIT_FILEPATH, 'utf-8'),
        },
      ]
    },
    handleHotUpdate: () => {
      // restart tests when code is updated
      devServerEvents.emit('dev-server:compile:success')

      return []
    },
  }
}
