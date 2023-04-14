import debugFn from 'debug'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
const debug = debugFn('cypress:vite-plugin-mock-esm')

const MODULE_IMPORTER_IDENTIFIER = '__cypressModule'

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
   * Remap dynamic import calls to use the Cypress module cache
   *
   * ```
   * const module1 = await import('module1')
   * import('module2')
   * ```
   *
   * becomes
   *
   * ```
   * const module1 = __cypressModule(await import('module1'));
   * __cypressModule(import('module2'));
   * ```
   */
  const mapDynamicImportsToCache = (moduleId: string, code: string) => {
    debug(`Remapping dynamic imports for module ${moduleId}`)

    return code.replace(
      /((await )?import\(.+?\))/ig,
      `${MODULE_IMPORTER_IDENTIFIER}($1)`,
    )
  }

  return {
    name: 'cypress:mocks',
    enforce: 'post',
    transform (code, id, options) {
      // Process all files to remap imports
      // TODO: Restrict to JS files only? Any potential for .mjs etc?
      let transformedCode = mapImportsToCache(id, code)

      transformedCode = mapDynamicImportsToCache(id, transformedCode)

      return {
        code: transformedCode,
      }
    },
    async transformIndexHtml (html) {
      // Process index.html file to remap imports
      let transformedHtml = mapImportsToCache('index', html)

      transformedHtml = mapDynamicImportsToCache('index', transformedHtml)

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
