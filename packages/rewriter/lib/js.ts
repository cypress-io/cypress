import debugModule from 'debug'
import * as astTypes from 'ast-types'
import * as recast from 'recast'
import { rewriteJsFnsCb } from './js-rules'

export type RewriteNodeFn = (js: string, n: typeof astTypes) => astTypes.Visitor

const debug = debugModule('cypress:rewriter:js')

export function rewriteJs (js: string) {
  const rewriteJsFns = rewriteJsFnsCb(js, astTypes)

  try {
    const ast = recast.parse(js)

    astTypes.visit(ast, rewriteJsFns)

    return recast.print(ast, {
      // will only affect reprinted quotes
      quote: 'single',
    }).code
  } catch (err) {
    debug('got an error rewriting JS, returning unmodified %o', { err, js: js.slice(0, 500) })

    return js
  }
}

export function rewriteJsAsync (js: string) {
  const rewriteJsFns = rewriteJsFnsCb(js, astTypes)

  try {
    const ast = recast.parse(js)

    astTypes.visit(ast, rewriteJsFns)

    return recast.print(ast, {
      // will only affect reprinted quotes
      quote: 'single',
    }).code
  } catch (err) {
    debug('got an error rewriting JS, returning unmodified %o', { err, js: js.slice(0, 500) })

    return js
  }
}
