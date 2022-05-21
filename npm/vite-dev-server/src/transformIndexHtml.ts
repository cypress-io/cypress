import { resolve } from 'pathe'
import fs from 'fs'
import debugFn from 'debug'

const debug = debugFn('cypress:vite-dev-server:transformIndexHtml')

const INIT_FILEPATH = resolve(__dirname, '../client/initCypressTests.js')

let loader: string
const getLoader = async (): Promise<string> => {
  if (!loader) {
    loader = await fs.promises.readFile(INIT_FILEPATH, 'utf8')
  }

  return loader
}

export async function transformIndexHtml (projectRoot: string, indexHtmlFile: string): Promise<string> {
  const indexHtmlPath = resolve(projectRoot, indexHtmlFile)

  debug('resolved the indexHtmlPath as', indexHtmlPath, 'from', indexHtmlFile)
  const indexHtmlContent = await fs.promises.readFile(indexHtmlPath, { encoding: 'utf8' })
  // find </body> last index
  const endOfBody = indexHtmlContent.lastIndexOf('</body>')

  // insert the script in the end of the body
  return `${indexHtmlContent.substring(0, endOfBody)
}<script>
${await getLoader()}
</script>${
  indexHtmlContent.substring(endOfBody)
}`
}
