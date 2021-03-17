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
      devServerEvents.emit('dev-server:compile:success')

      return []
    },
    // TODO subscribe on the compile error hook and call the
    // devServerEvents.emit('dev-server:compile:error', err)
    // it looks like for now (02.02.2021) there is no way to subscribe to an error
  }
}
