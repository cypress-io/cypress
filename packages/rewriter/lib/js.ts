import * as astTypes from 'ast-types'
import Debug from 'debug'
import { rewriteJsFnsCb } from './js-rules'
import * as recast from 'recast'

const debug = Debug('cypress:rewriter:js')

export type RewriteNodeFn = (js: string, n: typeof astTypes) => astTypes.Visitor

export function rewriteJs (js: string): string {
  try {
    const rewriteJsFns = rewriteJsFnsCb(js, astTypes)
    const ast = recast.parse(js)

    astTypes.visit(ast, rewriteJsFns)

    return recast.print(ast, {
      // will only affect reprinted quotes
      quote: 'single',
    }).code
  } catch (err) {
    debug('error while parsing JS %o', { err, js: js.slice(0, 500) })

    return js
  }
}
