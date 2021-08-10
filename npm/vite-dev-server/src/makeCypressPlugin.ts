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

function getSpecsPathsSet (specs: Spec[]) {
  return new Set<string>(
    specs.map((spec) => spec.absolute),
  )
}

interface Spec{
  absolute: string
  relative: string
}

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  devServerEvents: EventEmitter,
  specs: Spec[],
): Plugin => {
  let base = '/'

  let specsPathsSet = getSpecsPathsSet(specs)

  devServerEvents.on('dev-server:specs:changed', (specs: Spec[]) => {
    specsPathsSet = getSpecsPathsSet(specs)
  })

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
      let iterationNumber = 0

      const exploredFiles = new Set<string>()

      // until we reached a point where the current module is imported by no other
      while (moduleImporters?.size) {
        if (iterationNumber > HMR_DEPENDENCY_LOOKUP_MAX_ITERATION) {
          debug(`max hmr iteration reached: ${HMR_DEPENDENCY_LOOKUP_MAX_ITERATION}; Rerun will not happen on this file change.`)

          return []
        }

        // as soon as we find one of the specs, we trigger the re-run of tests
        for (const mod of moduleImporters.values()) {
          debug('handleHotUpdate - mod.file', mod.file)
          if (mod.file === supportFilePath) {
            debug('handleHotUpdate - support compile success')
            devServerEvents.emit('dev-server:compile:success')

            // if we update support we know we have to re-run it all
            // no need to ckeck further
            return []
          }

          if (mod.file && specsPathsSet.has(mod.file)) {
            debug('handleHotUpdate - spec compile success', mod.file)
            devServerEvents.emit('dev-server:compile:success', { specFile: mod.file })
            // if we find one spec, does not mean we are done yet,
            // there could be other spec files to re-run
            // see https://github.com/cypress-io/cypress/issues/17691
          }

          // to avoid circular updates, keep track of what we updated
          if (mod.file) {
            exploredFiles.add(mod.file)
          }
        }

        // get all the modules that import the current one
        moduleImporters = getImporters(moduleImporters, exploredFiles)
        iterationNumber += 1
      }

      return []
    },
  }
}

function getImporters (modules: Set<ModuleNode>, alreadyExploredFiles: Set<string>): Set<ModuleNode> {
  const allImporters = new Set<ModuleNode>()

  modules.forEach((m) => {
    if (m.file && !alreadyExploredFiles.has(m.file)) {
      m.importers.forEach((imp) => allImporters.add(imp))
    }
  })

  return allImporters
}
