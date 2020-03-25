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
const rewriteJsFnsCb: RewriteNodeFn = (_js, n) => {
  const b = n.builders

  function match (accessedObject, prop: string, maybeVal?: any) {
    const args = [
      // window
      b.identifier('window'),
      // accessedObject
      accessedObject,
      // 'prop'
      b.stringLiteral(prop),
    ]

    if (maybeVal) {
      // maybeVal is a Node
      args.push(maybeVal)
    }

    return b.callExpression(
      b.memberExpression(
        b.memberExpression(
          b.memberExpression(
            b.identifier('window'),
            b.identifier('top'),
          ),
          b.identifier('Cypress'),
        ),
        b.identifier('resolveWindowReference'),
      ),
      args,
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
          true,
        ),
      ),
      match(b.identifier('window'), prop),
      b.identifier(prop),
    )
  }

  function getReplaceablePropOfMemberExpression (node) {
    // something.(top|parent)
    if (node.property.type === 'Identifier' && ['parent', 'top', 'location', 'frames'].includes(node.property.name)) {
      return node.property.name
    }

    // something['(top|parent)']
    if (node.property.type === 'Literal' && ['parent', 'top', 'location', 'frames'].includes(String(node.property.value))) {
      return String(node.property.value)
    }
  }

  return {
    visitMemberExpression (path) {
      // is it a property access?
      const { node } = path

      const prop = getReplaceablePropOfMemberExpression(node)

      if (!prop) {
        this.traverse(path)

        return
      }

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

      return
    },
    visitAssignmentExpression (path) {
      const { node } = path

      const finish = () => {
        this.traverse(path)
      }

      if (node.left.type !== 'MemberExpression' || node.operator !== '=') {
        return finish()
      }

      const propBeingSet = getReplaceablePropOfMemberExpression(node.left)

      if (!propBeingSet) {
        return finish()
      }

      const objBeingSetOn = node.left.object

      path.replace(match(objBeingSetOn, propBeingSet, node.right))

      return false
    },
  }
}

type SecurityOpts = {
  isHtml?: boolean
}

export const strip = (source, opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return rewriteHtmlJs(source, rewriteJsFnsCb)
  }

  return rewriteJs(source, rewriteJsFnsCb)
}

export const stripStream = (opts: SecurityOpts = {}) => {
  if (opts.isHtml) {
    return pumpify(
      utf8Stream(),
      HtmlJsRewriter(rewriteJsFnsCb),
    )
  }

  const pt = new (stream.PassThrough)()

  return duplexify(
    pumpify(
      utf8Stream(),
      concatStream((body) => {
        pt.write(rewriteJs(body.toString(), rewriteJsFnsCb))
        pt.end()
      }),
    ),
    pt,
  )
}
