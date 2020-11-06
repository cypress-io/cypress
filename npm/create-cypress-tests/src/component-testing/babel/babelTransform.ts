import * as fs from 'fs-extra'
import * as babel from '@babel/core'
import * as babelTypes from '@babel/types'

export type PluginsAst = Record<'Require' | 'ModuleExportsBody', ReturnType<typeof babel.template>>

function tryRequirePrettier () {
  try {
    return require('prettier')
  } catch (e) {
    return null
  }
}

async function transformFileViaPlugin (filePath: string, babelPlugin: babel.PluginObj) {
  try {
    const initialCode = await fs.readFile(filePath, { encoding: 'utf-8' })

    const updatedResult = await babel.transformAsync(initialCode, {
      plugins: [babelPlugin],
    })

    if (!updatedResult) {
      return false
    }

    let finalCode = updatedResult.code

    if (finalCode === initialCode) {
      return false
    }

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
            path.parent.right.params.push(babelTypes.identifier('config'))
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

export async function injectPluginsCode (pluginsFilePath: string, ast: PluginsAst) {
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

export function createSupportBabelPlugin (importCode: string): babel.PluginObj<any> {
  const template = babel.template(importCode)

  const plugin: babel.PluginObj<{
    root: babel.NodePath<babel.types.Program>
    lastImport: babel.NodePath<babel.types.ImportDeclaration> |null
  }> = {
    visitor: {
      Program (path) {
        this.root = path
      },
      ImportDeclaration (path) {
        this.lastImport = path
      },
    },
    post () {
      if (this.lastImport) {
        this.lastImport.insertAfter(template())
      } else if (this.root) {
        this.root.unshiftContainer('body', template())
      }
    },
  }

  return plugin
}

export async function injectImportSupportCode (supportFilePath: string, importCode: string) {
  return transformFileViaPlugin(supportFilePath, createSupportBabelPlugin(importCode))
}
