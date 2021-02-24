import { resolve } from 'path'
import { readFileSync } from 'fs'
import { render } from 'mustache'

const indexHtmlPath = resolve(__dirname, '../index-template.html')
const readIndexHtml = () => readFileSync(indexHtmlPath).toString()

interface HandleIndexOptions {
  projectRoot: string
  supportFilePath: string
  output: string // the code
}

export function makeHtml(options: HandleIndexOptions) {
  const indexHtml = readIndexHtml()
  // const specPath = `/${req.headers.__cypress_spec_path}`
  // const supportPath = supportFilePath ? `/${relative(projectRoot, supportFilePath)}` : null

  return render(indexHtml, { output: options.output }) // { supportPath, specPath }))
}
