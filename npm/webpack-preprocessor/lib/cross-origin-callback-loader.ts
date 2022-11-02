import _ from 'lodash'
import { parse } from '@babel/parser'
import { default as traverse } from '@babel/traverse'
import { default as generate } from '@babel/generator'
import { NodePath, types as t } from '@babel/core'
import * as loaderUtils from 'loader-utils'
import * as pathUtil from 'path'
import Debug from 'debug'

import mergeSourceMaps from './merge-source-map'
import { crossOriginCallbackStore } from './cross-origin-callback-store'
import utils from './utils'

const debug = Debug('cypress:webpack')

// this loader makes supporting dependencies within cross-origin callbacks
// possible. if there are no dependencies (e.g. no requires/imports), it's a
// noop. otherwise: it does this by doing the following:
// - extracts the callbacks
//   - the callbacks are kept in memory and then run back through webpack
//     once the initial file compilation is complete
// - replaces the callbacks with objects
//   - this object references the file the callback will be output to by
//     its own compilation. this allows the runtime to get the file and
//     run it in its origin's context.
export default function (source: string, map, meta, store = crossOriginCallbackStore) {
  const { resourcePath } = this
  const options = typeof this.getOptions === 'function'
    ? this.getOptions() // webpack 5
    : loaderUtils.getOptions(this) // webpack 4
  const commands = (options.commands || []) as string[]

  let ast: t.File

  try {
    // purposefully lenient in allowing syntax since the user can't configure
    // this, but probably has their own webpack or target configured to
    // handle it
    ast = parse(source, {
      allowImportExportEverywhere: true,
      allowAwaitOutsideFunction: true,
      allowSuperOutsideMethod: true,
      allowUndeclaredExports: true,
      sourceType: 'unambiguous',
      sourceFilename: resourcePath,
    })
  } catch (err) {
    // it's unlikely there will be a parsing error, since that should have
    // already been caught by a previous loader, but if there is and it isn't
    // possible to get the AST, there's nothing we can do, so just callback
    // with the original source
    debug('parsing error for file (%s): %s', resourcePath, err.stack)

    this.callback(null, source, map)

    return
  }

  let hasDependencies = false

  traverse(ast, {
    CallExpression (path) {
      const callee = path.get('callee') as NodePath<t.MemberExpression>

      if (!callee.isMemberExpression()) return

      // bail if we're not inside a supported command
      if (!commands.includes((callee.node.property as t.Identifier).name)) {
        return
      }

      const lastArg = _.last(path.get('arguments'))

      // the user could try an invalid signature where the last argument is
      // not a function. in this case, we'll return the unmodified code and
      // it will be a runtime validation error
      if (
        !lastArg || (
          !lastArg.isArrowFunctionExpression()
          && !lastArg.isFunctionExpression()
        )
      ) {
        return
      }

      // determine if there are any requires/imports within the callback
      lastArg.traverse({
        CallExpression (path) {
          if (
            // e.g. const dep = require('../path/to/dep')
            // @ts-ignore
            path.node.callee.name === 'require'
            // e.g. const dep = await import('../path/to/dep')
            || path.node.callee.type as string === 'Import'
          ) {
            hasDependencies = true
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
      // the tmpdir path uses a hashed version of the source file path
      // so that it can be cleaned up without removing other in-use tmpdirs
      // (notably the support file persists between specs, so its cross-origin
      // callback output files need to persist as well)
      const sourcePathHash = utils.hash(resourcePath)
      const outputDir = utils.tmpdir(sourcePathHash)
      // use a hash of the contents in file name to ensure it's unique. if
      // the contents happen to be the same, it's okay if they share a file
      const codeHash = utils.hash(modifiedGeneratedCode)
      const inputFileName = `cross-origin-cb-${codeHash}`
      const outputFilePath = `${pathUtil.join(outputDir, inputFileName)}.js`

      store.addFile(resourcePath, {
        inputFileName,
        outputFilePath,
        source: modifiedGeneratedCode,
      })

      // replaces callback function with object referencing the extracted
      // function's callback name and output file path in the form
      // { callbackName: <callbackName>, outputFilePath: <outputFilePath> }
      // this is used at runtime when the command is run to execute the bundle
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

  // if no requires/imports were found, callback with the original source/map
  if (!hasDependencies) {
    debug('callback with original source')
    this.callback(null, source, map)

    return
  }

  // if we found requires/imports, re-generate the code from the AST
  const result = generate(ast, { sourceMaps: true }, {
    [resourcePath]: source,
  })
  // result.map needs to be merged with the original map for it to include
  // the changes made in this loader. we can't return result.map because it
  // is based off the intermediary code provided to the loader and not the
  // original source code (which could be TypeScript or JSX or something)
  const newMap = mergeSourceMaps(map, result.map)

  debug('callback with modified source')
  this.callback(null, result.code, newMap)
}
