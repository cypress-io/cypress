import * as astTypes from 'ast-types'
import Debug from 'debug'
import { jsRules } from './js-rules'
import * as recast from 'recast'
import {
  inlineSourceMapFormatter,
  tryDecodeInlineSourceMap,
  getSourceRoot,
} from './source-maps'

const debug = Debug('cypress:rewriter:js')

export function rewriteJs (url: string, js: string): string {
  try {
    const ast = recast.parse(js, {
      sourceFileName: 'source.js', // value does not affect reprinted map/code
    })

    astTypes.visit(ast, jsRules)

    return inlineSourceMapFormatter(recast.print(ast, {
      // will only affect reprinted quotes
      quote: 'single',
      sourceMapName: 'source.js.map',
      // this is synchronous, so we can only decode inline source maps
      inputSourceMap: tryDecodeInlineSourceMap(js),
      sourceRoot: getSourceRoot(url),
    }))
  } catch (err) {
    debug('error while parsing JS %o', { err, js: js ? js.slice(0, 500) : js })

    return js
  }
}
