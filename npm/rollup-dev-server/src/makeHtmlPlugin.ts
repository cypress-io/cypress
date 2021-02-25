import { relative, resolve } from 'path'
import { readFileSync } from 'fs'
import { render } from 'mustache'
import { Express } from 'express'

/**
 * Rormat the requested spec file.
 * Nollup writes everything to a single directory (eg /dist)
 * All outputted files are *.js.
 * RunnerCt requests specs using the original filename including extension.
 *
 * Example usage:
 * formatSpecName('/cypress/component/foo.spec.tsx') //=> 'foo.spec.js'
 */
function formatSpecName (filename: string) {
  const split = filename.split('/')
  const name = split[split.length - 1]
  const pos = name.lastIndexOf('.')
  const newName = `${name.substr(0, pos < 0 ? name.length : pos)}.js`

  return `/${newName}`
}

function handleIndex (indexHtml: string, projectRoot: string, supportFilePath: string, cypressSpecPath: string) {
  const specPath = `/${cypressSpecPath}`
  // const supportPath = supportFilePath ? `/${relative(projectRoot, supportFilePath)}` : null
  // const supportFile = readFileSync(supportPath).toString()

  return render(indexHtml, {
    // supportFile,
    specPath: formatSpecName(specPath),
  })
}

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  server: Express,
) => {
  const indexHtmlPath = resolve(__dirname, '../index-template.html')
  const readIndexHtml = () => readFileSync(indexHtmlPath).toString()

  const indexHtml = readIndexHtml()

  server.use('/index.html', (req, res) => {
    const html = handleIndex(
      indexHtml,
      projectRoot,
      supportFilePath,
      req.headers.__cypress_spec_path as string,
    )

    res.end(html)
  })
}
