import _ from 'lodash'
import { HtmlJsRewriter, rewriteHtmlJs, rewriteJs } from '@packages/rewriter'
import duplexify from 'duplexify'
import concatStream from 'concat-stream'
import stream from 'stream'

const pumpify = require('pumpify')
const utf8Stream = require('utf8-stream')

function match (varName, prop) {
  return `(window.top.Cypress.resolveWindowReference(window, ${varName}, '${prop}'))`
}

// need to inject a ternary to determine if `prop === window.prop` (has not been redefined in a closure), now we're having fun
const closureDetectionTern = (prop) => {
  return `(${prop} === window['${prop}'] ? ${match('window', prop)} : ${prop})`
}

/**
 * Given an ESTree node and the corresponding source code, either:
 *  1. returns a string that replaces the node in `js`, or
 *  2. returns nothing to not modify the node at all
 *
 * @see https://runkit.com/flotwig/esprima-doodle for experiments in
 *  converting common JS constructs to ESTree nodes
 *
 * @param js Full JS source that `node` comes from
 * @param node ESTree node with range metadata
 */
function rewriteJsFn (js: string, node) {
  function get (path: string) {
    return _.get(node, path)
  }

  function eq (path: string, value: string) {
    return get(path) === value
  }

  // is it a property access?
  if (eq('type', 'MemberExpression')) {
    let prop

    // something.(top|parent)
    if (eq('property.type', 'Identifier') && ['parent', 'top', 'location', 'frames'].includes(get('property.name'))) {
      prop = get('property.name')
    }

    // something['(top|parent)']
    if (eq('property.type', 'Literal') && ['parent', 'top', 'location', 'frames'].includes(get('property.value'))) {
      prop = get('property.value')
    }

    if (!prop) {
      return
    }

    // don't use _.slice since it converts js to an array first
    const objSrc = _.chain(js.slice(node.range[0], node.property.range[0]))
    // sometimes the slice has a . or [ in it, wish i could find a more
    // elegant way to fix
    .trimEnd('.[')
    .value()

    return match(objSrc, prop)
  }

  // is it a direct `top` or `parent` reference in a conditional?
  if (eq('type', 'BinaryExpression')) {
    // (top|parent) != .*
    if (eq('left.type', 'Identifier') && ['parent', 'top'].includes(get('left.name'))) {
      const remainingSrc = js.slice(node.left.range[1], node.range[1])

      return closureDetectionTern(get('left.name')) + remainingSrc
    }

    // .* != (top|parent)
    if (eq('right.type', 'Identifier') && ['parent', 'top'].includes(get('right.name'))) {
      const leadingSrc = js.slice(node.range[0], node.right.range[0])

      return leadingSrc + closureDetectionTern(get('right.name'))
    }
  }

  return
}

type SecurityOpts = {
  isHtml?: boolean
}

const strip = (source, opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return rewriteHtmlJs(source, rewriteJsFn)
  }

  return rewriteJs(source, rewriteJsFn)
}

const stripStream = (opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return pumpify(
      utf8Stream(),
      HtmlJsRewriter(rewriteJsFn)
    )
  }

  const pt = new (stream.PassThrough)()

  return duplexify(
    pumpify(
      utf8Stream(),
      concatStream((body) => {
        pt.write(rewriteJs(body.toString(), rewriteJsFn))
        pt.end()
      })
    ),
    pt
  )
}

module.exports = {
  strip,

  stripStream,
}
