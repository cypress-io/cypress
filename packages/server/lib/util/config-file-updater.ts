import _ from 'lodash'
import { parse } from '@babel/parser'
import type { File } from '@babel/types'
import type { NodePath } from 'ast-types/lib/node-path'
import { visit } from 'recast'
import type { namedTypes } from 'ast-types'
import Debug from 'debug'
import { fs } from './fs'
import errors from '../errors'
import { pathToConfigFile, read, SettingsOptions } from './settings'

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

  obj = _.extend(config, obj)

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

  await fs.writeFile(file, await insertValueInJSString(fileContents, obj, config, file))

  return { ...config, ...obj }
}

export async function insertValueInJSString (fileContents: string, obj: Record<string, any>, config: Record<string, any>, configFilePath: string): Promise<string> {
  const ast = parse(fileContents, { plugins: ['typescript'], sourceType: 'module' })

  let objectLiteralStartIndex = -1
  let objectLiteralEndIndex = -1
  let objectLiteralNode: namedTypes.ObjectExpression

  function handleExports (nodePath: NodePath<namedTypes.CallExpression, any> | NodePath<namedTypes.ObjectExpression, any>) {
    if (nodePath.node.type === 'CallExpression'
        && nodePath.node.callee.type === 'Identifier') {
      const functionName = nodePath.node.callee.name

      if (isDefineConfigFunction(ast, functionName)) {
        return handleExports(nodePath.get('arguments', 0))
      }

      throw errors.get('COULD_NOT_INSERT_IN_CONFIG_FILE', obj, configFilePath)
    }

    if (nodePath.node.type === 'ObjectExpression') {
      objectLiteralNode = nodePath.node
      objectLiteralStartIndex = (objectLiteralNode as any).start + 1
      objectLiteralEndIndex = (objectLiteralNode as any).end - 1
      debug('found object litteral %o', objectLiteralNode)
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

  const objKeys = Object.keys(obj)

  const keysToInsert = objKeys.filter((key) => !config[key])
  const keysToUpdate = objKeys.filter((key) => config[key] && config[key] !== obj[key])

  debug('keys absent from the original config ', keysToInsert)

  const valuesInserted = keysToInsert.length ? `\n  ${ keysToInsert.map((key) => `${key}: ${JSON.stringify(obj[key])},`).join('\n  ')}` : ''

  debug('inserting values ', valuesInserted)

  if (objectLiteralStartIndex < 0) {
    if (keysToUpdate.length) {
      throw errors.get('COULD_NOT_UPDATE_IN_CONFIG_FILE', obj, configFilePath)
    } else if (keysToInsert.length) {
      throw errors.get('COULD_NOT_INSERT_IN_CONFIG_FILE', obj, configFilePath)
    } else {
      return fileContents
    }
  }

  const insertedValuesSplicer: Splicer[] = keysToInsert.length ? [{
    start: objectLiteralStartIndex,
    end: objectLiteralStartIndex,
    replaceString: valuesInserted,
  }] : []

  const originalLiteralObjectContents = fileContents.slice(objectLiteralStartIndex, objectLiteralEndIndex)

  debug(`Will try to update ${JSON.stringify(originalLiteralObjectContents)} with ${keysToUpdate}`)

  const updatedObjectContentsSplicers: Splicer[] = keysToUpdate.reduce(
    (acc: Splicer[], key: string) => {
      const propertyToUpdate = objectLiteralNode.properties.find((prop) => {
        return prop.type === 'ObjectProperty' && prop.key.type === 'Identifier' && prop.key.name === key
      && (prop.value.type === 'NumericLiteral' || prop.value.type === 'StringLiteral' || prop.value.type === 'BooleanLiteral')
      && prop.value.value === config[key]
      })

      if (propertyToUpdate) {
        acc.push({
          start: (propertyToUpdate as any).start,
          end: (propertyToUpdate as any).end,
          replaceString: `${key}: ${JSON.stringify(obj[key])}`,
        })
      } else {
        throw errors.get('COULD_NOT_UPDATE_CONFIG_FILE', obj, configFilePath)
      }

      return acc
    }, insertedValuesSplicer as Splicer[],
  )

  debug('updatedObjectContentsSplicers %o', updatedObjectContentsSplicers)

  const sortedSplicers = updatedObjectContentsSplicers.sort((a, b) => a.start > b.start ? 1 : -1)

  debug('sortedSplicers %o', sortedSplicers)

  if (!sortedSplicers.length) return fileContents

  let nextStartingIndex = 0
  let resultCode = ''

  sortedSplicers.forEach((splicer) => {
    resultCode += fileContents.slice(nextStartingIndex, splicer.start) + splicer.replaceString
    nextStartingIndex = splicer.end
  })

  return resultCode + fileContents.slice(nextStartingIndex)
}

export function isDefineConfigFunction (ast: File, functionName: string): boolean {
  let value = false

  visit(ast, {
    visitVariableDeclarator (nodePath) {
      // if this is a require of cypress
      if (nodePath.node.init?.type === 'CallExpression'
      && nodePath.node.init.callee.type === 'Identifier'
      && nodePath.node.init.callee.name === 'require'
      && nodePath.node.init.arguments[0].type === 'StringLiteral'
      && nodePath.node.init.arguments[0].value === 'cypress') {
        if (nodePath.node.id?.type === 'ObjectPattern') {
          const defineConfigFunctionNode = nodePath.node.id.properties.find((prop) => {
            return prop.type === 'ObjectProperty'
          && prop.key.type === 'Identifier'
          && prop.key.name === 'defineConfig'
          })

          if (defineConfigFunctionNode) {
            value = (defineConfigFunctionNode as any).value?.name === functionName
          }
        }
      }

      return false
    },
    visitImportDeclaration (nodePath) {
      if (nodePath.node.source.type === 'StringLiteral'
      && nodePath.node.source.value === 'cypress') {
        const defineConfigFunctionNode = nodePath.node.specifiers?.find((specifier) => {
          return specifier.type === 'ImportSpecifier'
          && specifier.imported.type === 'Identifier'
        && specifier.imported.name === 'defineConfig'
        })

        if (defineConfigFunctionNode) {
          value = (defineConfigFunctionNode as any).local?.name === functionName
        }
      }

      return false
    },
  })

  return value
}

interface Splicer{
  start: number
  end: number
  replaceString: string
}
