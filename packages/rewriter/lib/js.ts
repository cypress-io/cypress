import * as astTypes from 'ast-types'
import Debug from 'debug'
import { jsRules } from './js-rules'
import * as recast from 'recast'
import * as sourceMaps from './util/source-maps'

const debug = Debug('cypress:rewriter:js')

const defaultPrintOpts: recast.Options = {
  // will only affect reprinted quotes
  quote: 'single',
}

type OriginalSourceInfo = { url: string, js: string }

export type DeferSourceMapRewriteFn = (sourceInfo: OriginalSourceInfo) => string

export function rewriteJsSourceMap (url: string, js: string, inputSourceMap: any): any {
  try {
    const { sourceFileName, sourceMapName, sourceRoot } = sourceMaps.getPaths(url)

    const ast = recast.parse(js, { sourceFileName })

    astTypes.visit(ast, jsRules)

    return recast.print(ast, {
      inputSourceMap,
      sourceMapName,
      sourceRoot,
      ...defaultPrintOpts,
    }).map
  } catch (err) {
    debug('error while parsing JS %o', { err, js: js.slice ? js.slice(0, 500) : js })

    return { err }
  }
}

export function rewriteJs (url: string, js: string, deferSourceMapRewrite: DeferSourceMapRewriteFn): string {
  try {
    const ast = recast.parse(js)

    astTypes.visit(ast, jsRules)

    const { code } = recast.print(ast, defaultPrintOpts)

    // get an ID that can be used to lazy-generate the source map later
    const sourceMapId = deferSourceMapRewrite({ url, js })

    return sourceMaps.urlFormatter(
      // using a relative URL ensures that required cookies + other headers are sent along
      // and can be reused if the user's sourcemap requires an HTTP request to be made
      `/__cypress/source-maps/${sourceMapId}.map`,
      code,
    )
  } catch (err) {
    debug('error while parsing JS %o', { err, js: js.slice ? js.slice(0, 500) : js })

    return js
  }
}
