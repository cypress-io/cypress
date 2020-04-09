import { RewriteNodeFn } from './js'
import { MemberExpressionKind } from 'ast-types/gen/kinds'

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
export const rewriteJsFnsCb: RewriteNodeFn = (_js, n) => {
  const b = n.builders

  // use `globalThis` instead of `window`, `self`... to lower chances of scope conflict
  // users can technically override even this, but it would be very rude
  // "[globalThis] provides a way for polyfills/shims, build tools, and portable code to have a reliable non-eval means to access the global..."
  // @see https://github.com/tc39/proposal-global/blob/master/NAMING.md
  const globalIdentifier = b.identifier('globalThis')

  function match (accessedObject, prop: string, maybeVal?: any) {
    const args = [
      // window
      globalIdentifier,
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
            globalIdentifier,
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
    return b.parenthesizedExpression(
      b.conditionalExpression(
        b.binaryExpression(
          '===',
          b.identifier(prop),
          b.memberExpression(
            globalIdentifier,
            b.stringLiteral(prop),
            true,
          ),
        ),
        match(globalIdentifier, prop),
        b.identifier(prop),
      ),
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
        return this.traverse(path)
      }

      path.replace(match(path.get('object').node, prop))

      return false
    },
    visitIdentifier (path) {
      const { node } = path

      if (path.parentPath && [
        'LabeledStatement', // like `top: foo();`
        'Property', // like `{ top: 'foo' }`
        'FunctionDeclaration', // like `function top()`
        'RestElement', // like (...top)
        'ArrowFunctionExpression', // like `(top, ...parent) => { }`
        'ArrowExpression',
        'FunctionExpression', // like `(function top())`
      ].includes(path.parentPath.node.type)) {
        // some Identifiers do not refer to a scoped variable, skip those
        return false
      }

      if (
        path.parentPath && path.parentPath.node.type === 'VariableDeclarator'
        && path.parentPath.node.id === node
      ) {
        // like `var top = 'foo'`
        return false
      }

      if (['parent', 'top'].includes(node.name)) {
        path.replace(closureDetectionTern(node.name))

        return false
      }

      return this.traverse(path)
    },
    visitAssignmentExpression (path) {
      const { node } = path

      const finish = () => {
        this.traverse(path)
      }

      if (node.left.type !== 'MemberExpression') {
        return finish()
      }

      if (node.operator !== '=') {
        // in the case of +=, -=, |=, etc., assume they're not doing something like
        // `window.top += 4` since that would be invalid anyways, just continue down the RHS
        return this.traverse(path.get('right'))
      }

      const propBeingSet = getReplaceablePropOfMemberExpression(node.left)

      if (!propBeingSet) {
        return finish()
      }

      const objBeingSetOn = (node.left as MemberExpressionKind).object

      path.replace(match(objBeingSetOn, propBeingSet, node.right))

      return false
    },
  }
}
