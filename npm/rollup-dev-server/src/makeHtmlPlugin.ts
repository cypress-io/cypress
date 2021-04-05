import { resolve } from 'path'
import { readFileSync } from 'fs'
import { render } from 'mustache'
import { Express } from 'express'

const indexHtmlPath = resolve(__dirname, '../index-template.html')
const readIndexHtml = () => readFileSync(indexHtmlPath).toString()

function handleIndex (indexHtml: string, projectRoot: string, supportFilePath: string) {
  const supportFile = readFileSync(supportFilePath).toString()

  return render(indexHtml, {
    supportFile,
  })
}

export const makeHtmlPlugin = (
  projectRoot: string,
  supportFilePath: string,
  server: Express,
  publicPath: string,
) => {
  const indexHtml = readIndexHtml()

  server.use(`${publicPath}/index.html`, (req, res) => {
    const html = handleIndex(
      indexHtml,
      projectRoot,
      supportFilePath,
    )

    res.end(html)
  })
}
