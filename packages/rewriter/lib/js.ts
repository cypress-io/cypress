import * as astTypes from 'ast-types'
import Debug from 'debug'
import { jsRules } from './js-rules'
import * as recast from 'recast'

const debug = Debug('cypress:rewriter:js')

export function rewriteJs (js: string): string {
  try {
    const ast = recast.parse(js)

    astTypes.visit(ast, jsRules)

    return recast.print(ast, {
      // will only affect reprinted quotes
      quote: 'single',
    }).code
  } catch (err) {
    debug('error while parsing JS %o', { err, js: js.slice(0, 500) })

    return js
  }
}
