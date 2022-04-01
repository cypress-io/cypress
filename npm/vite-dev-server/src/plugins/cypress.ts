import debugFn from 'debug'
import { readFile } from 'fs/promises'
import { resolve } from 'pathe'
import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { normalizePath } from 'vite'

const debug = debugFn('cypress:vite-dev-server:plugins:cypress')

const INIT_FILEPATH = resolve(__dirname, '../../client/initCypressTests.js')

const HMR_DEPENDENCY_LOOKUP_MAX_ITERATION = 50

interface Spec {
  absolute: string
  relative: string
}

function getSpecsPathsSet (specs: Spec[]) {
  return new Set<string>(
    specs.map((spec) => spec.absolute),
  )
}

export const Cypress = (
  options,
): Plugin => {
  let base = '/'

  const projectRoot = options.config.projectRoot
  const supportFilePath = options.config.supportFile
  const devServerEvents = options.devServerEvents
  const specs = options.specs
  const indexHtmlFile = options.config.indexHtmlFile

  let specsPathsSet = getSpecsPathsSet(specs)
  let loader

  devServerEvents.on('dev-server:specs:changed', (specs: Spec[]) => {
    specsPathsSet = getSpecsPathsSet(specs)
  })

  return {
    name: 'cypress:main',
    enforce: 'pre',
    configResolved (config) {
      base = config.base
    },
    async transformIndexHtml () {
      const indexHtmlPath = resolve(projectRoot, indexHtmlFile)

      debug('resolved the indexHtmlPath as', indexHtmlPath, 'from', indexHtmlFile)
      const indexHtmlContent = await readFile(indexHtmlPath, { encoding: 'utf8' })
      // find </body> last index
      const endOfBody = indexHtmlContent.lastIndexOf('</body>')

      // insert the script in the end of the body
      return `${indexHtmlContent.substring(0, endOfBody)
    }<script>
    ${loader}
    </script>${
      indexHtmlContent.substring(endOfBody)
    }`
    },
    configureServer: async (server: ViteDevServer) => {
      loader = await readFile(INIT_FILEPATH)

      server.middlewares.use(`${base}index.html`, async (req, res) => {
        const transformedIndexHtml = await server.transformIndexHtml(base, '')

        return res.end(transformedIndexHtml)
      })
    },
    handleHotUpdate: ({ server, file }) => {
      debug('handleHotUpdate - file', file)

      // If the user provided IndexHtml is changed, do a full-reload
      if (normalizePath(file) === resolve(projectRoot, indexHtmlFile)) {
        server.ws.send({
          type: 'full-reload',
        })

        return
      }

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
            // no need to check further
            return []
          }

          if (mod.file && specsPathsSet.has(mod.file)) {
            debug('handleHotUpdate - spec compile success', mod.file)
            devServerEvents.emit('dev-server:compile:success', { specFile: mod.file })
            // if we find one spec, does not mean we are done yet,
            // there could be other spec files to re-run
            // see https://github.com/cypress-io/cypress/issues/17691
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

/**
 * Gets all the modules that import the set of modules passed in parameters
 * @param modules the set of module whose dependents to return
 * @param alreadyExploredFiles set of files that have already been looked at and should be avoided in case of circular dependency
 * @returns a set of ModuleMode that import directly the current modules
 */
function getImporters (modules: Set<ModuleNode>, alreadyExploredFiles: Set<string>): Set<ModuleNode> {
  const allImporters = new Set<ModuleNode>()

  modules.forEach((m) => {
    if (m.file && !alreadyExploredFiles.has(m.file)) {
      alreadyExploredFiles.add(m.file)
      m.importers.forEach((imp) => {
        allImporters.add(imp)
      })
    }
  })

  return allImporters
}
