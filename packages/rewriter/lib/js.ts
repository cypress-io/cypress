import debugModule from 'debug'
import * as astTypes from 'ast-types'
import * as recast from 'recast'

export type RewriteNodeFn = (js: string, n: typeof astTypes) => astTypes.Visitor

const debug = debugModule('cypress:rewriter:js')

export function rewriteJs (js: string, rewriteNodeFnsCb: RewriteNodeFn) {
  const rewriteNodeFns = rewriteNodeFnsCb(js, astTypes)

  try {
    const ast = recast.parse(js)

    astTypes.visit(ast, rewriteNodeFns)

    return recast.print(ast, {
      // will only affect reprinted quotes
      quote: 'single',
    }).code
  } catch (err) {
    debug('got an error rewriting JS, returning unmodified %o', { err, js })

    if (process.env.CYPRESS_ENV !== 'production') {
      throw err // TODO: remove?
    }

    return js
  }
}
