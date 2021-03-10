import { EventEmitter } from 'events'
import { relative, resolve } from 'path'
import { readFileSync } from 'fs'
import { Plugin, ViteDevServer } from 'vite'
import { render } from 'mustache'

const pluginName = 'cypress-transform-html'
const indexHtmlPath = resolve(__dirname, '../index-template.html')
const readIndexHtml = () => readFileSync(indexHtmlPath).toString()

function handleIndex (indexHtml, projectRoot, supportFilePath, req, res) {
  const specPath = `/${req.headers.__cypress_spec_path}`
  const supportPath = supportFilePath ? `/${relative(projectRoot, supportFilePath)}` : null

  res.end(render(indexHtml, { supportPath, specPath }))
}

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  devServerEvents: EventEmitter,
): Plugin => {
  return {
    name: pluginName,
    enforce: 'pre',
    configureServer: (server: ViteDevServer) => {
      const indexHtml = readIndexHtml()

      server.middlewares.use('/index.html', (req, res) => handleIndex(indexHtml, projectRoot, supportFilePath, req, res))
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
