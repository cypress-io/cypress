import _ from 'lodash'
import { parse } from '@babel/parser'
import { default as traverse } from '@babel/traverse'
import { default as generate } from '@babel/generator'
import { NodePath, types as t } from '@babel/core'
import * as pathUtil from 'path'
import { crossOriginCallbackStore } from './cross-origin-callback-store'
import utils from './utils'

// this loader makes supporting dependencies within the cy.origin() callbacks
// possible. it does this by doing the following:
// - extracting callback(s)
//   - the callback(s) is/are kept in memory and then run back through webpack
//     once the initial file compilation is complete
//   - users use Cypress.require() in their test code instead of require().
//     this is because we don't want require()s nested within the callback
//     to be processed in the initial compilation. this both improves
//     performance and prevents errors (when the dependency has ES import
//     statements, babel will error because they're not top-level since
//     the require is not top-level)
// - replacing Cypress.require() with require()
//   - this allows the require()s to be processed normally during the
//     compilation of the callback itself.
// - replacing the callback(s) with object(s)
//   - this object references the file the callback will be output to by
//     its own compilation. this allows the runtime to get the file and
//     run it in its origin's context.
export default function (source, map, meta, store = crossOriginCallbackStore) {
  const { resourcePath } = this

  let ast

  try {
    ast = parse(source, {
      allowImportExportEverywhere: true,
      sourceType: 'unambiguous',
    })
  } catch (err) {
    // TODO: actually error somehow?

    return source
  }

  let hasDependencies = false

  traverse(ast, {
    CallExpression (path) {
      const callee = path.get('callee') as NodePath<t.MemberExpression>

      if (!callee.isMemberExpression()) return

      // check if we're inside a cy.origin() callback
      if ((callee.node.property as t.Identifier).name !== 'origin') return

      const lastArg = _.last(path.get('arguments'))

      // the user could try an invalid signature for cy.origin() where the
      // last argument is not a function. in this case, we'll return the
      // unmodified code and it will be a runtime validation error
      if (
        !lastArg || (
          !lastArg.isArrowFunctionExpression()
          && !lastArg.isFunctionExpression()
        )
      ) {
        return
      }

      // replace instances of Cypress.require('dep') with require('dep')
      lastArg.traverse({
        CallExpression (path) {
          const callee = path.get('callee') as NodePath<t.MemberExpression>

          // e.g. const dep = Cypress.require('../path/to/dep')
          if (callee.matchesPattern('Cypress.require')) {
            hasDependencies = true

            path.replaceWith(
              t.callExpression(
                callee.node.property as t.Expression, // 'require'
                path.get('arguments').map((arg) => arg.node), // ['../path/to/dep']
              ),
            )
          }
        },
      }, this)

      if (!hasDependencies) return

      // generate the extracted callback function from an AST into a string
      // and assign it to a variable. we wrap this generated code when we
      // eval the code, so the variable is set up and then invoked. it ends up
      // like this:
      //
      // let __cypressCrossOriginCallback              】added at runtime
      // (function () {                                ┓ added by webpack
      //   // ... webpack stuff stuff ...              ┛
      //   __cypressCrossOriginCallback = (args) => {  ┓ extracted callback
      //     const dep = require('../path/to/dep')     ┃
      //     // ... test stuff ...                     ┃
      //   }                                           ┛
      //   // ... webpack stuff stuff ...              ┓ added by webpack
      // }())                                          ┛
      // __cypressCrossOriginCallback(args)            】added at runtime
      //
      const callbackName = '__cypressCrossOriginCallback'
      const generatedCode = generate(lastArg.node, {}).code
      const modifiedGeneratedCode = `${callbackName} = ${generatedCode}`
      const hash = utils.hash(modifiedGeneratedCode)
      const outputDir = utils.tmpdir()
      const inputFileName = `cross-origin-cb-${hash}`
      const outputFilePath = `${pathUtil.join(outputDir, inputFileName)}.js`

      store.addFile(resourcePath, {
        inputFileName,
        outputFilePath,
        source: modifiedGeneratedCode,
      })

      // replaces callback function with object referencing the extracted
      // function's callback name and output file path in the form
      // { callbackName: <callbackName>, outputFilePath: <outputFilePath> }
      // this is used at runtime when cy.origin() is run to execute the bundle
      // generated for the extracted callback function
      lastArg.replaceWith(
        t.objectExpression([
          t.objectProperty(
            t.stringLiteral('callbackName'),
            t.stringLiteral(callbackName),
          ),
          t.objectProperty(
            t.stringLiteral('outputFilePath'),
            t.stringLiteral(outputFilePath),
          ),
        ]),
      )
    },
  })

  // if we found Cypress.require()s, re-generate the code from the AST
  if (hasDependencies) {
    // TODO: handle sourcemaps for this correctly.
    // the following causes error "Cannot read property 'replace' of undefined"
    // return generate(ast, { sourceMaps: true }, source).code
    return generate(ast, {}).code
  }

  // if no Cypress.require()s were found, return the original source
  return source
}
