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

export const makeHtmlPlugin = (projectRoot: string, supportFilePath: string): Plugin => {
  return {
    name: pluginName,
    enforce: 'pre',
    configureServer: (server: ViteDevServer) => {
      const indexHtml = readIndexHtml()

      server.middlewares.use('/index.html', (req, res) => handleIndex(indexHtml, projectRoot, supportFilePath, req, res))
    },
  }
}
