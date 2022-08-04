import * as _ from 'lodash'
import { parse } from '@babel/parser'
import { default as traverse } from '@babel/traverse'
import { default as generate } from '@babel/generator'
import { NodePath, types as t } from '@babel/core'
import * as pathUtil from 'path'
import { crossOriginCallbackStore } from './cross-origin-callback-store'
import utils from './utils'

// TODO: add comment about the purpose of this loader
export default function (source, map, meta, store = crossOriginCallbackStore) {
  const { resourcePath } = this

  const log = (...messages) => {
    console.log(`🟠 (${pathUtil.basename(resourcePath)}):`, ...messages)
  }

  let ast

  try {
    ast = parse(source, {
      allowImportExportEverywhere: true,
      sourceType: 'unambiguous',
    })
  } catch (err) {
    // TODO: actually error somehow?
    log('parse error:', err.stack)

    return source
  }

  let hasDependencies = false

  traverse(ast, {
    CallExpression (path) {
      const callee = path.get('callee') as NodePath<t.MemberExpression>

      if (!callee.isMemberExpression()) return

      // TODO: make this more customizable so it can support any other necessary
      // commands (iframe, iframeSetup) in the future
      if ((callee.node.property as t.Identifier).name !== 'origin') return

      const lastArg = _.last(path.get('arguments'))

      // the user could try an invalid signature for cy.origin() where the
      // last argument is not a function. in this case, we'll return the
      // unmodified code and it will be a runtime validation error
      if (
        !lastArg.isArrowFunctionExpression() && !lastArg.isFunctionExpression()
      ) {
        return
      }

      lastArg.traverse({
        CallExpression (path) {
          const callee = path.get('callee') as NodePath<t.MemberExpression>

          // e.g. const dep = Cypress.require('../path/to/dep')
          if (callee.matchesPattern('Cypress.require')) {
            hasDependencies = true

            // TODO: can we keep webpack from sending these deps through
            // and remove the need for Cypress.require()?

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
      // let __cypressCrossOriginCallback              】added before eval
      // (function () {                                ┓ added by webpack
      //   // ... webpack stuff stuff ...              ┛
      //   __cypressCrossOriginCallback = (args) => {  ┓ extracted callback
      //     const dep = require('../path/to/dep')     ┃
      //     // ... test stuff ...                     ┃
      //   }                                           ┛
      //   // ... webpack stuff stuff ...              ┓ added by webpack
      // }())                                          ┛
      // __cypressCrossOriginCallback(args)            】added before eval
      //
      const generatedCode = generate(lastArg.node, {}).code
      const modifiedGeneratedCode = `__cypressCrossOriginCallback = ${generatedCode}`
      const generatedHash = utils.hash(modifiedGeneratedCode)
      const fileDir = utils.tmpdir()
      const inputFileName = `cross-origin-cb-${generatedHash}-input.js`
      const outputFilePath = pathUtil.join(fileDir, `cross-origin-cb-${generatedHash}-output.js`)

      store.addFile(resourcePath, {
        inputFileName,
        outputFilePath,
        source: modifiedGeneratedCode,
      })

      // replaces callback function with object referencing the extracted
      // function's input and output file paths in the form
      // { inputFileName: <inputFileName>, outputFilePath: <outputFilePath> }
      // this is used at runtime when cy.origin() is run to run the bundle
      // generated for the extracted callback function
      lastArg.replaceWith(
        t.objectExpression([
          t.objectProperty(
            t.stringLiteral('inputFileName'),
            t.stringLiteral(inputFileName),
          ),
          t.objectProperty(
            t.stringLiteral('outputFilePath'),
            t.stringLiteral(outputFilePath),
          ),
        ]),
      )
    },
  })

  // if we found requires, re-generate the code from the AST
  if (hasDependencies) {
    // TODO: handle sourcemaps for this correctly.
    // the following causes error "Cannot read property 'replace' of undefined"
    // return generate(ast, { sourceMaps: true }, source).code
    return generate(ast, {}).code
  }

  // if no requires were found, return the original source
  return source
}
