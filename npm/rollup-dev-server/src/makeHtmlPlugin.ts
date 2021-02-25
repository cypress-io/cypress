import { relative, resolve } from 'path'
import { readFileSync } from 'fs'
import { render } from 'mustache'
import { Express } from 'express'

const pluginName = 'cypress-transform-html'
const indexHtmlPath = resolve(__dirname, '../index-template.html')
const readIndexHtml = () => readFileSync(indexHtmlPath).toString()

function handleIndex (indexHtml, projectRoot, supportFilePath, req, res) {
  const specPath = `/${req.headers.__cypress_spec_path}`
  const supportPath = supportFilePath ? `/${relative(projectRoot, supportFilePath)}` : null

  return render(indexHtml, { supportPath, specPath })
}

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  server: Express
) => {
  const indexHtml = readIndexHtml()
  server.use('/index.html', (req, res) => {
    const html = handleIndex(indexHtml, projectRoot, supportFilePath, req, res)
    res.end(html)
  })
}