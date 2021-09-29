import _ from 'lodash'
import { parse } from '@babel/parser'
import type { NodePath } from 'ast-types/lib/node-path'
import { visit } from 'recast'
import { fs } from './fs'
import errors from '../errors'
import { pathToConfigFile, read, SettingsOptions } from './settings'
import Debug from 'debug'

const debug = Debug('cypress:server:config-file-updater')

function _err (type, file, err) {
  const e = errors.get(type, file, err)

  e.code = err.code
  e.errno = err.errno
  throw e
}

function _logWriteErr (file, err) {
  return _err('ERROR_WRITING_FILE', file, err)
}

export async function insertValuesInConfigFile (projectRoot: string, obj = {}, options: SettingsOptions = {}) {
  const { configFile } = options

  if (configFile === false) {
    return {}
  }

  if (configFile && /\.json$/.test(configFile)) {
    return await insertValuesInJSON(projectRoot, obj, options)
  }

  return await insertValuesInJavaScript(projectRoot, obj, options)
}

export async function insertValuesInJSON (projectRoot: string, obj, options: SettingsOptions) {
  const config = await read(projectRoot, options)

  _.extend(config, obj)

  const file = pathToConfigFile(projectRoot, options)

  debug('writing json file')
  try {
    await fs.outputJson(file, obj, { spaces: 2 })
  } catch (err) {
    return _logWriteErr(file, err)
  }

  return obj
}

export async function insertValuesInJavaScript (projectRoot: string, obj, options: SettingsOptions) {
  const file = pathToConfigFile(projectRoot, options)

  const config = await read(projectRoot, options)
  const fileContents = await fs.readFile(file, { encoding: 'utf8' })

  await fs.writeFile(file, await insertValueInJSString(fileContents, obj, config))

  return { ...config, ...obj }
}

export async function insertValueInJSString (fileContents: string, obj: Record<string, any>, config: Record<string, any>) {
  const ast = parse(fileContents, { plugins: ['typescript'] })

  let newValueIndex = -1

  function handleExports (nodePath: NodePath<any, any>) {
    if (nodePath.node.type === 'CallExpression'
        && nodePath.node.callee.type === 'Identifier'
        && nodePath.node.callee.name === 'defineConfig') {
      return handleExports(nodePath.get('arguments', 0))
    }

    if (nodePath.node.type === 'ObjectExpression') {
      newValueIndex = nodePath.node.start + 1
    }
  }

  visit(ast, {
    visitAssignmentExpression (nodePath) {
      if (nodePath.node.left.type === 'MemberExpression') {
        if (nodePath.node.left.object.type === 'Identifier' && nodePath.node.left.object.name === 'module'
        && nodePath.node.left.property.type === 'Identifier' && nodePath.node.left.property.name === 'exports') {
          handleExports(nodePath.get('right'))
        }
      }

      return false
    },
    visitExportDefaultDeclaration (nodePath) {
      handleExports(nodePath.get('declaration'))

      return false
    },
  })

  const absentKeys = Object.keys(obj).filter((key) => !config[key])

  const valuesInserted = absentKeys.map((key) => `${key}:${JSON.stringify(obj[key])},`).join('\n  ')

  if (newValueIndex < 0) {
    throw errors.get('COULD_NOT_UPDATE_CONFIG_FILE', valuesInserted)
  }

  return fileContents.slice(0, newValueIndex) + valuesInserted + fileContents.slice(newValueIndex + 1)
}
