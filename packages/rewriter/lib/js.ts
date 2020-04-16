import * as astTypes from 'ast-types'
import Debug from 'debug'
import { jsRules } from './js-rules'
import * as recast from 'recast'
import * as sourceMaps from './source-maps'

const debug = Debug('cypress:rewriter:js')

const defaultPrintOpts: recast.Options = {
  // will only affect reprinted quotes
  quote: 'single',
}

export function rewriteJs (url: string, js: string): string {
  try {
    const { sourceFileName, sourceMapName, sourceRoot } = sourceMaps.getPaths(url)

    const ast = recast.parse(js, { sourceFileName })

    astTypes.visit(ast, jsRules)

    // this is synchronous, so we can only decode inline source maps
    return sourceMaps.inlineFormatter(recast.print(ast, {
      inputSourceMap: sourceMaps.tryDecodeInline(js),
      sourceMapName,
      sourceRoot,
      ...defaultPrintOpts,
    }))
  } catch (err) {
    debug('error while parsing JS %o', { err, js: js.slice ? js.slice(0, 500) : js })

    return js
  }
}
