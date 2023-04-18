import debugLib from 'debug'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

const debug = debugLib('cypress:vite-plugin-proxify-esm')

const MODULE_IMPORTER_IDENTIFIER = '__cypressModule'
const MODULE_DYNAMIC_IMPORTER_IDENTIFIER = '__cypressDynamicModule'

const MODULE_CACHE_FILEPATH = path.resolve(__dirname, '../client/moduleCache.js')

export const CypressMocks = (): Plugin => {
  /**
   * Remap static import calls to use the Cypress module cache
   *
   * ```
   * import DefaultExport, { NamedExport } from 'module'
   * ```
   *
   * becomes
   *
   * ```
   * import * as _cypress_module_1 from 'module';
   * const DefaultExport = __cypressModule(_cypress_module_1);
   * const { NamedExport } = __cypressModule(_cypress_module_1);
   * ```
   */
  const mapImportsToCache = (moduleId: string, code: string) => {
    debug(`Remapping imports for module ${moduleId}`)
    let counter = 0

    const moduleIdentifier = moduleId.replace(/[^a-zA-Z\d]/gi, '_')

    const importRegex = /import (.+?) from (.*)/ig

    return code.replace(
      importRegex,
      (match, importVars: string, importTarget: string) => {
        debug(`Mapping import ${counter + 1} in module ${moduleId}`)

        let replacement = `import * as cypress_${moduleIdentifier}_${++counter} from ${importTarget};`

        // Support `import TheDefault, { Named } from 'module'` syntax, split into two separate assignments
        importVars.split(/(?:(?<=})\s*,\s*)|(?:\s*,\s*(?={))/gi).forEach((importVar) => {
          // replacement += `const ${importVar} = ${MODULE_IMPORTER_IDENTIFIER}('${moduleId}', cypress_${moduleIdentifier}_${counter});`
          replacement += `const ${importVar} = ${MODULE_IMPORTER_IDENTIFIER}(cypress_${moduleIdentifier}_${counter});`
        })

        return match.replace(
          importRegex,
          replacement,
        ).replace(/[\n\r]/g, '').replace(/const \* as/g, 'const')
      },
    )
  }

  /**
   * Transform dynamic imports to use a runtime that turns the ES modules into proxies by injecting
   * a `cypressModule` runtime.
   *
   * `cypressModule` returns a Promise than resolves to the original import that has been
   * "proxified" to side step the fact ES Modules are immutable and sealed.
   *
   * Examples - https://regex101.com/r/Ic1OHA/1
   *
   * Given:
   *   const m = import("./mod_1")
   *   const m = await import("lodash")
   *   import("./mod_2").then(mod => mod)
   *
   * Returns:
   *   const m = cypressModule(import("./mod_1"))
   *   const m = await cypressModule(import("lodash"))
   *   cypressModule(import("./mod_2")).then(mod => mod)
   */
  const mapDynamicImportsToCache = (code: string) => {
    const RE = /(import\(.+?\))/gi

    const c = code.replace(RE, `${MODULE_DYNAMIC_IMPORTER_IDENTIFIER}($1)`)

    return c
  }

  return {
    name: 'cypress:mocks',
    enforce: 'post',
    transform (code, id, options) {
      // Process all files to remap imports
      // TODO: Restrict to JS files only? Any potential for .mjs etc?
      let transformedCode = mapImportsToCache(id, code)

      transformedCode = mapDynamicImportsToCache(transformedCode)

      return {
        code: transformedCode,
      }
    },
    async transformIndexHtml (html) {
      // Process index.html file to remap imports
      let transformedHtml = mapImportsToCache('index', html)

      transformedHtml = mapDynamicImportsToCache(transformedHtml)

      return {
        html: transformedHtml,
        tags: [
          // Pull in Cypress module cache script
          {
            tag: 'script',
            attrs: {
              type: 'module',
            },
            // eslint-disable-next-line no-restricted-syntax
            children: fs.readFileSync(MODULE_CACHE_FILEPATH, 'utf-8'),
          },
        ],
      }
    },
  }
}
