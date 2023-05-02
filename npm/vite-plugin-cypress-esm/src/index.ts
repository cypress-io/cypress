import debugFn from 'debug'
import picomatch from 'picomatch'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
const debug = debugFn('cypress:vite-plugin-mock-esm')

const MODULE_IMPORTER_IDENTIFIER = '__cypressModule'
const MODULE_DYNAMIC_IMPORTER_IDENTIFIER = '__cypressDynamicModule'

const MODULE_CACHE_FILEPATH = path.resolve(
  __dirname,
  '../client/moduleCache.js',
)

interface CypressEsmOptions {
  ignoreList?: string[]
}

export const CypressEsm = (options?: CypressEsmOptions): Plugin => {
  const ignoreList = options?.ignoreList ?? []

  const importOnIgnoreList = (importTarget: string) => {
    for (const ignore of ignoreList) {
      if (picomatch.matchBase(importTarget, ignore)) {
        return true
      }
    }
  }
  /**
   * Remap static import calls to use the Cypress module cache
   *
   * ```
   * import DefaultExport, { NamedExport, Other as Alias } from 'module'
   * ```
   *
   * becomes
   *
   * ```
   * import * as _cypress_module_1 from 'module';
   * const DefaultExport = __cypressModule(_cypress_module_1);
   * const { NamedExport, Other: Alias } = __cypressModule(_cypress_module_1);
   * ```
   */
  const mapImportsToCache = (moduleId: string, code: string) => {
    debug(`Remapping imports for module ${moduleId}`)
    let counter = 0

    const moduleIdentifier = moduleId.replace(/[^a-zA-Z\d]/g, '_')

    const importRegex = /import (.+?) from (.*)/g

    return code.replace(
      importRegex,
      (match, importVars: string, importTarget: string) => {
        debug(`Mapping import ${counter + 1} in module ${moduleId}`)

        let replacement = `import * as cypress_${moduleIdentifier}_${++counter} from ${importTarget}`

        if (importOnIgnoreList(importTarget)) {
          return match
        }

        if (!replacement.endsWith(';')) {
          replacement += ';'
        }

        // Split the import declaration into named vs non-named segments
        // e.g.: import TheDefault, { Named }, * as Everything from 'module'
        // ======> ['TheDefault', '{ Named }', 'Everything']
        importVars
        .split(/(?:(?<=})\s*,\s*)|(?:\s*,\s*(?={))/g)
        .forEach((importVar) => {
          const declarations = []

          // If we're handling a destructure assignment then there aren't any special cases, can map through
          // as a single assignment operation
          if (importVar.includes('{')) {
            declarations.push(importVar)
          } else {
            // Outside of a destructure we need to split each comma block as a separate assignment...
            declarations.push(
              ...importVar
              .split(',')
              // ...because we need to account for potential `* as foo` syntax
              .map((decl) => decl.replace(/\*\s+as\s+/g, '').trim())
              .filter((decl) => !!decl),
            )
          }

          let destructuredImports = declarations
          .map((decl) => {
            // support `import { foo as bar } from 'module'` syntax, converting to `const { foo: bar } ...`
            decl = decl.replace(/(?<!\*) as /g, ': ')

            return `const ${decl} = ${MODULE_IMPORTER_IDENTIFIER}('${moduleId}', cypress_${moduleIdentifier}_${counter}, ${debug.enabled});`
          })
          .join('')

          replacement += destructuredImports
        })

        return match
        .replace(importRegex, replacement)
        .replace(/[\n\r]/g, '')
        .replace(/const \* as/g, 'const')
      },
    )
  }

  /**
   * Transform dynamic imports to use a runtime that turns the ES modules into proxies by injecting
   * a `__cypressDynamicModule` runtime.
   *
   * `__cypressDynamicModule` returns a Promise that resolves to the original import which has been
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
   *   const m = __cypressDynamicModule(import("./mod_1"))
   *   const m = await __cypressDynamicModule(import("lodash"))
   *   __cypressDynamicModule(import("./mod_2")).then(mod => mod)
   */
  const mapDynamicImportsToCache = (id: string, code: string) => {
    const RE = /(import\((.+?)\))/g

    return code.replace(
      RE,
      (match, importVars: string, importTarget: string) => {
        if (importOnIgnoreList(importTarget)) {
          return match
        }

        return match.replace(
          RE,
          `${MODULE_DYNAMIC_IMPORTER_IDENTIFIER}('${id}', $1, ${debug.enabled})`,
        )
      },
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
