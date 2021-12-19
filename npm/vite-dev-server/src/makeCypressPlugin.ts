import { resolve } from 'path'
import { readFile } from 'fs/promises'
import Debug from 'debug'
import { ModuleNode, Plugin, ViteDevServer, normalizePath } from 'vite'

const debug = Debug('cypress:vite-dev-server:plugin')

const pluginName = 'cypress-transform-html'

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
  supportFilePath: string | false,
  devServerEvents: NodeJS.EventEmitter,
  specs: Spec[],
  buildMode: boolean,
  indexHtml?: string,
): Plugin => {
  let base = '/'

  let specsPathsSet = getSpecsPathsSet(specs)

  devServerEvents.on('dev-server:specs:changed', (specs: Spec[]) => {
    specsPathsSet = getSpecsPathsSet(specs)
  })

  const posixSupportFilePath = supportFilePath ? normalizePath(resolve(projectRoot, supportFilePath)) : undefined
  const posixIndexHtml = indexHtml ? normalizePath(resolve(projectRoot, indexHtml)) : undefined

  const normalizedSupportFilePath = posixSupportFilePath ? `${base}@fs/${posixSupportFilePath}` : undefined

  return {
    name: pluginName,
    enforce: 'pre',
    configResolved (config) {
      base = config.base
    },
    async transform (code: string, id: string): Promise<string> {
      if (id === resolve(projectRoot, 'index.html') && buildMode) {
        debug('transformIndexHtml with base', base)
        const indexHtmlPath = indexHtml ? resolve(projectRoot, indexHtml) : resolve(__dirname, '..', 'index.html')
        const indexHtmlContent = await readFile(indexHtmlPath, { encoding: 'utf8' })
        // find </body> last index
        const endOfBody = indexHtmlContent.lastIndexOf('</body>')

        // insert the script in the end of the body
        return `${indexHtmlContent.substring(0, endOfBody)
        }<script src="/cypress:client-init-test" type="module"></script>${
          indexHtmlContent.substring(endOfBody)
        }`
      }

      return code
    },
    async transformIndexHtml () {
      if (!buildMode) {
        debug('transformIndexHtml with base', base)
        const indexHtmlPath = indexHtml ? resolve(projectRoot, indexHtml) : resolve(__dirname, '..', 'index.html')
        const indexHtmlContent = await readFile(indexHtmlPath, { encoding: 'utf8' })

        return {
          html: indexHtmlContent,
          // load the script at the end of the body
          // script has to be loaded when the vite client is connected
          tags: [{
            tag: 'script',
            injectTo: 'body',
            attrs: {
              type: 'module',
              src: `${base}cypress:client-init-test`,
            },
          }],
        }
      }
    },
    resolveId (id) {
      if (id === 'cypress:config') {
        return id
      }

      if (id === 'cypress:support-path') {
        return posixSupportFilePath
      }

      if (id === 'cypress:spec-loaders') {
        return id
      }

      if (id === '/cypress:client-init-test') {
        return INIT_FILEPATH
      }
    },
    load (id) {
      if (id === 'cypress:spec-loaders') {
        return `export default {\n${specs.map((s) => {
          return `${JSON.stringify(s.relative)}:()=>import(${JSON.stringify(s.absolute)})`
        }).join(',\n')}\n}`
      }

      if (id === 'cypress:config') {
        return `
export const supportPath = ${JSON.stringify(normalizedSupportFilePath)}
export const originAutUrl = ${JSON.stringify(`__cypress/iframes/${normalizePath(projectRoot)}/`)}`
      }
    },
    configureServer: async (server: ViteDevServer) => {
      server.middlewares.use(`${base}index.html`, async (req, res) => {
        const transformedIndexHtml = await server.transformIndexHtml(base, '')

        return res.end(transformedIndexHtml)
      })
    },
    handleHotUpdate: ({ server, file }) => {
      debug('handleHotUpdate - file', file)

      // If the user provided IndexHtml is changed, do a full-reload
      if (file === posixIndexHtml) {
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
