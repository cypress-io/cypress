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

type OriginalSourceInfo = { url: string, js: string, uniqueId?: string }

// the AST rules in `js-rules.ts` only ever rewrite code that references
// `top`, `parent`, or `location` - if none of those appear as whole words in
// the source, parsing it into an AST is guaranteed to be a no-op, so the
// expensive parse + visit can be skipped entirely. `\u` is also matched,
// since a unicode escape sequence could disguise one of those identifiers
// (e.g. `window.\u0074op` is `window.top`)
const possibleRewriteTargetsRe = /\b(?:top|parent|location)\b|\\u/

export function hasPossibleRewriteTargets (js: string): boolean {
  return possibleRewriteTargetsRe.test(js)
}

function _generateDriverError (url: string, err: Error) {
  const args = JSON.stringify({
    errMessage: err.message,
    errStack: err.stack,
    url,
  })

  return `window.top.Cypress.utils.throwErrByPath('proxy.js_rewriting_failed', { args: ${args} })`
}

// a function that, given source info, returns an id that can be used to build the sourcemap later
export type DeferSourceMapRewriteFn = (sourceInfo: OriginalSourceInfo) => string

export function rewriteJsSourceMap (url: string, js: string, inputSourceMap: any): any {
  try {
    if (inputSourceMap && !hasPossibleRewriteTargets(js)) {
      // the rewriter could not have changed the source, so the original sourcemap is still accurate
      return inputSourceMap
    }

    const { sourceFileName, sourceMapName, sourceRoot } = sourceMaps.getPaths(url)

    const ast = recast.parse(js, { sourceFileName })

    const visitor = astTypes.PathVisitor.fromMethodsObject(jsRules)

    visitor.visit(ast)

    if (!visitor.wasChangeReported() && inputSourceMap) {
      return inputSourceMap
    }

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

export function _rewriteJsUnsafe (url: string, js: string, deferSourceMapRewrite?: DeferSourceMapRewriteFn): string {
  let rewritten = js

  if (hasPossibleRewriteTargets(js)) {
    const ast = recast.parse(js)

    let didRewrite: boolean

    try {
      const visitor = astTypes.PathVisitor.fromMethodsObject(jsRules)

      visitor.visit(ast)

      didRewrite = visitor.wasChangeReported()
    } catch (err: any) {
      // if visiting fails, it points to a bug in our rewriting logic, so raise the error to the driver
      return _generateDriverError(url, err)
    }

    if (didRewrite) {
      const { code } = recast.print(ast, defaultPrintOpts)

      rewritten = code
    }
  }

  if (!deferSourceMapRewrite) {
    // no sourcemaps
    return sourceMaps.stripMappingUrl(rewritten)
  }

  // get an ID that can be used to lazy-generate the source map later
  const sourceMapId = deferSourceMapRewrite({ url, js })

  return sourceMaps.urlFormatter(
    // using a relative URL ensures that required cookies + other headers are sent along
    // and can be reused if the user's sourcemap requires an HTTP request to be made
    `/__cypress/source-maps/${sourceMapId}.map`,
    rewritten,
  )
}

export function rewriteJs (url: string, js: string, deferSourceMapRewrite?: DeferSourceMapRewriteFn): string {
  try {
    // rewriting can throw on invalid JS or if there are bugs in the js-rules, so always wrap it
    return _rewriteJsUnsafe(url, js, deferSourceMapRewrite)
  } catch (err) {
    debug('error while parsing JS %o', { err, js: js.slice ? js.slice(0, 500) : js })

    return js
  }
}
