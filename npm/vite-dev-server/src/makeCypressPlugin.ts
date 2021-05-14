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

const INIT_FILEPATH = resolve(__dirname, '../client/initCypressTests.js')

const HMR_DEPENDENCY_LOOKUP_MAX_ITERATION = 50

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  devServerEvents: EventEmitter,
  specs: {absolute: string, relative: string}[],
): Plugin => {
  let base = '/'

  const specsPathsSet = new Set<string>(specs.map((spec) => spec.absolute))

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
            'import.meta.env.__cypress_originUrlPrefix': JSON.stringify(`__cypress/iframes/`),
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
      let iterationNumber = 0

      // until we reached a point where the current module is imported by no other
      while (moduleImporters && moduleImporters.size) {
        if (iterationNumber > HMR_DEPENDENCY_LOOKUP_MAX_ITERATION) {
          debug(`max hmr iteration reached: ${HMR_DEPENDENCY_LOOKUP_MAX_ITERATION}; Rerun will not happen on this file change.`)

          return []
        }

        // as soon as we find one of the specs, we trigger the re-run of tests
        for (const mod of moduleImporters.values()) {
          if (specsPathsSet.has(mod.file)) {
            debug('handleHotUpdate - compile success')
            devServerEvents.emit('dev-server:compile:success')

            return []
          }
        }

        // get all the modules that import the current one
        moduleImporters = getImporters(moduleImporters)
        iterationNumber += 1
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
