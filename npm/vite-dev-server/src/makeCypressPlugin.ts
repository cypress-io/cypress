import { resolve, posix, sep } from 'path'
import { readFile } from 'fs'
import { promisify } from 'util'
import Debug from 'debug'
import { ModuleNode, Plugin, ViteDevServer } from 'vite'

const debug = Debug('cypress:vite-dev-server:plugin')

const read = promisify(readFile)

const pluginName = 'cypress-transform-html'
const OSSepRE = new RegExp(`\\${sep}`, 'g')

function convertPathToPosix (path: string): string {
  return sep === '/'
    ? path
    : path.replace(OSSepRE, '/')
}

const INIT_FILEPATH = posix.resolve(__dirname, '../client/initCypressTests.js')

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  devServerEvents: EventEmitter,
  specs: {absolute: string, relative: string}[],
): Plugin => {
  let base = '/'

  const posixSupportFilePath = supportFilePath ? convertPathToPosix(resolve(projectRoot, supportFilePath)) : undefined

  const normalizedSupportFilePath = posixSupportFilePath ? `${base}@fs/${posixSupportFilePath}` : undefined

  return {
    name: pluginName,
    enforce: 'pre',
    config (_, env) {
      if (env) {
        return {
          define: {
            'import.meta.env.__cypress_supportPath': JSON.stringify(normalizedSupportFilePath),
            'import.meta.env.__cypress_originAutUrl': JSON.stringify(`__cypress/iframes/${convertPathToPosix(projectRoot)}/`),
          },
        }
      }
    },
    configResolved (config) {
      base = config.base
    },
    transformIndexHtml () {
      debug('transformIndexHtml with base', base)

      return [
        // load the script at the end of the body
        // script has to be loaded when the vite client is connected
        {
          tag: 'script',
          injectTo: 'body',
          attrs: { type: 'module' },
          children: `import(${JSON.stringify(`${base}@fs/${INIT_FILEPATH}`)})`,
        },
      ]
    },
    configureServer: async (server: ViteDevServer) => {
      const indexHtml = await read(resolve(__dirname, '..', 'index.html'), { encoding: 'utf8' })

      const transformedIndexHtml = await server.transformIndexHtml(base, indexHtml)

      server.middlewares.use(`${base}index.html`, (req, res) => res.end(transformedIndexHtml))
    },
    handleHotUpdate: ({ server, file }) => {
      debug('handleHotUpdate - file', file)
      // get the graph node for the file that just got updated
      let moduleImporters = server.moduleGraph.fileToModulesMap.get(file)
      let stopIteration = false

      // until we reached a point where the current module is imported by no other
      while (moduleImporters && moduleImporters.size) {
        // as soon as we find one of the specs, we trigger the re-run of tests
        moduleImporters.forEach((mod) => {
          if (specs.some((spec) => spec.absolute === mod.file)) {
            debug('handleHotUpdate - compile success')
            devServerEvents.emit('dev-server:compile:success')
            // don't go any further if the refresh is done
            // NOTE: we cannot do return here since we are inside of a sub-function.
            // It would move us only one step above.
            stopIteration = true
          }
        })

        if (stopIteration) {
          return []
        }

        // get all the modules that import the current one
        moduleImporters = getImporters(moduleImporters)
      }

      return []
    },
  }
}

function getImporters (modules: Set<ModuleNode>): Set<ModuleNode> {
  const allImporters = new Set<ModuleNode>()

  modules.forEach((m) => {
    m.importers.forEach((imp) => allImporters.add(imp))
  })

  return allImporters
}
