import path from 'path'
import * as fs from 'fs-extra'
import * as babel from '@babel/core'
import * as babelTypes from '@babel/types'

type PluginsAst = Record<'Require' | 'ModuleExportsBody', ReturnType<typeof babel.template>>

export function createTransformPluginsFileBabelPlugin (ast: PluginsAst): babel.PluginObj {
  return {
    visitor: {
      Program: (path) => {
        path.unshiftContainer('body', ast.Require())
      },
      Function: (path) => {
        if (!babelTypes.isAssignmentExpression(path.parent)) {
          return
        }

        const assignment = path.parent.left

        const isModuleExports =
        babelTypes.isMemberExpression(assignment)
        && babelTypes.isIdentifier(assignment.object)
        && assignment.object.name === 'module'
        && babelTypes.isIdentifier(assignment.property)
        && assignment.property.name === 'exports'

        if (isModuleExports && babelTypes.isFunction(path.parent.right)) {
          const paramsLength = path.parent.right.params.length

          if (paramsLength === 0) {
            path.parent.right.params.push(babelTypes.identifier('on'))
          }

          if (paramsLength === 1) {
            path.parent.right.params.push(babelTypes.identifier('config'))
          }

          path.get('body').pushContainer('body' as never, ast.ModuleExportsBody())
        }
      },
    },
  }
}

function tryRequirePrettier () {
  try {
    return require('prettier')
  } catch (e) {
    return null
  }
}

async function transformFileViaPlugin (filePath: string, babelPlugin: babel.PluginObj) {
  try {
    const pluginsFile = await fs.readFile(filePath, { encoding: 'utf-8' })

    const updatedResult = await babel.transformAsync(pluginsFile, {
      plugins: [babelPlugin],
    })

    if (!updatedResult) {
      return false
    }

    let finalCode = updatedResult.code
    const maybePrettier = tryRequirePrettier()

    if (maybePrettier && maybePrettier.format) {
      finalCode = maybePrettier.format(finalCode, { parser: 'babel' })
    }

    await fs.writeFile(filePath, finalCode)

    return true
  } catch (e) {
    return false
  }
}

export async function autoInjectPluginsCode (pluginsFilePath: string, ast: PluginsAst) {
  return transformFileViaPlugin(pluginsFilePath, createTransformPluginsFileBabelPlugin(ast))
}

export async function getPluginsSourceExample (ast: PluginsAst) {
  const exampleCode = [
    'module.exports = (on, config) => {',
    '',
    '}',
  ].join('\n')

  const babelResult = await babel.transformAsync(exampleCode, {
    plugins: [createTransformPluginsFileBabelPlugin(ast)],
  })

  if (!babelResult?.code) {
    throw new Error('Can not generate code example for plugins file')
  }

  return babelResult.code
}

export async function injectImportSupportCode (supportFilePath: string, importCode: string) {
  const template = babel.template(importCode)
  const plugin: babel.PluginObj = {
    visitor: {
      Program: (path) => {
        path.unshiftContainer('body', template())
      },
    },
  }

  return transformFileViaPlugin(supportFilePath, plugin)
}
