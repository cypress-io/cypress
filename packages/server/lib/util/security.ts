import { HtmlJsRewriter, rewriteHtmlJs, rewriteJs, RewriteNodeFn } from '@packages/rewriter'
import duplexify from 'duplexify'
import concatStream from 'concat-stream'
import stream from 'stream'

const pumpify = require('pumpify')
const utf8Stream = require('utf8-stream')

// need to inject a ternary to determine if `prop === window.prop` (has not been redefined in a closure), now we're having fun
// const closureDetectionTern = (prop) => {
//   return `(${prop} === window['${prop}'] ? ${match('window', prop)} : ${prop})`
// }

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
const rewriteJsFnsCb: RewriteNodeFn = (js, n) => {
  const b = n.builders

  function match (accessedObject, prop: string) {
    return b.callExpression(
      b.memberExpression(
        b.memberExpression(
          b.memberExpression(
            b.identifier('window'),
            b.identifier('top')
          ),
          b.identifier('Cypress')
        ),
        b.identifier('resolveWindowReference')
      ),
      [
        // window
        b.identifier('window'),
        // accessedObject
        accessedObject,
        // 'prop'
        b.stringLiteral(prop),
      ]
    )
  }

  // (PROP === window['PROP'] ? MATCH : PROP)
  function closureDetectionTern (prop) {
    return b.conditionalExpression(
      b.binaryExpression(
        '===',
        b.identifier(prop),
        b.memberExpression(
          b.identifier('window'),
          b.stringLiteral(prop),
          true
        )
      ),
      match(b.identifier('window'), prop),
      b.identifier(prop)
    )
  }

  return {
    visitMemberExpression (path) {
      // is it a property access?
      let prop
      const { node } = path

      // function get (path: string) {
      //   return _.get(node, path)
      // }

      // function eq (path: string, value: string) {
      //   return get(path) === value
      // }

      // something.(top|parent)
      if (node.property.type === 'Identifier' && ['parent', 'top', 'location', 'frames'].includes(node.property.name)) {
        prop = node.property.name
      }

      // something['(top|parent)']
      if (node.property.type === 'Literal' && ['parent', 'top', 'location', 'frames'].includes(String(node.property.value))) {
        prop = String(node.property.value)
      }

      if (!prop) {
        this.traverse(path)

        return
      }

      // // don't use _.slice since it converts js to an array first
      // const objSrc = _.chain(js.slice(node.range[0], node.property.range[0]))
      // // sometimes the slice has a . or [ in it, wish i could find a more
      // // elegant way to fix
      // .trimEnd('.[')
      // .value()

      // TODO: this stringification can be thrown out when match is refactored not to use recast
      // const objSrc = recast.print(path.node.original.object).code

      path.replace(match(path.get('object').node, prop))

      return false
    },
    visitBinaryExpression (path) {
      const { node } = path

      // is it a direct `top` or `parent` reference in a conditional?
      // (top|parent) != .*
      if (node.left.type === 'Identifier' && ['parent', 'top'].includes(node.left.name)) {
        path.get('left').replace(closureDetectionTern(node.left.name))

        return false
      }

      // .* != (top|parent)
      if (node.right.type === 'Identifier' && ['parent', 'top'].includes(node.right.name)) {
        path.get('right').replace(closureDetectionTern(node.right.name))

        return false
      }

      this.traverse(path)
    },
  }
}

type SecurityOpts = {
  isHtml?: boolean
}

const strip = (source, opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return rewriteHtmlJs(source, rewriteJsFnsCb)
  }

  return rewriteJs(source, rewriteJsFnsCb)
}

const stripStream = (opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return pumpify(
      utf8Stream(),
      HtmlJsRewriter(rewriteJsFnsCb)
    )
  }

  const pt = new (stream.PassThrough)()

  return duplexify(
    pumpify(
      utf8Stream(),
      concatStream((body) => {
        pt.write(rewriteJs(body.toString(), rewriteJsFnsCb))
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
