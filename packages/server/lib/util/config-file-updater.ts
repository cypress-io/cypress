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

  await fs.writeFile(file, await insertValueInJSString(fileContents, obj, config))

  return { ...config, ...obj }
}

export async function insertValueInJSString (fileContents: string, obj: Record<string, any>, config: Record<string, any>): Promise<string> {
  const ast = parse(fileContents, { plugins: ['typescript'], sourceType: 'module' })

  let objectLiteralNode: namedTypes.ObjectExpression | undefined

  function handleExport (nodePath: NodePath<namedTypes.CallExpression, any> | NodePath<namedTypes.ObjectExpression, any>) {
    if (nodePath.node.type === 'CallExpression'
        && nodePath.node.callee.type === 'Identifier') {
      const functionName = nodePath.node.callee.name

      if (isDefineConfigFunction(ast, functionName)) {
        return handleExport(nodePath.get('arguments', 0))
      }
    }

    if (nodePath.node.type === 'ObjectExpression' && !nodePath.node.properties.find((prop) => prop.type !== 'ObjectProperty')) {
      objectLiteralNode = nodePath.node
      debug('found object litteral %o', objectLiteralNode)

      return
    }

    throw errors.get('COULD_NOT_UPDATE_CONFIG_FILE', obj, 'Exported object is not an object literal')
  }

  visit(ast, {
    visitAssignmentExpression (nodePath) {
      if (nodePath.node.left.type === 'MemberExpression') {
        if (nodePath.node.left.object.type === 'Identifier' && nodePath.node.left.object.name === 'module'
        && nodePath.node.left.property.type === 'Identifier' && nodePath.node.left.property.name === 'exports') {
          handleExport(nodePath.get('right'))
        }
      }

      return false
    },
    visitExportDefaultDeclaration (nodePath) {
      handleExport(nodePath.get('declaration'))

      return false
    },
  })

  const splicers: Splicer[] = []

  if (!objectLiteralNode) {
    // if the export is no object litteral
    throw errors.get('COULD_NOT_UPDATE_CONFIG_FILE', obj, 'No export could be found')
  }

  setRootKeysSplicers(splicers, obj, config, objectLiteralNode, '  ')
  setSubKeysSplicers(splicers, obj, config, objectLiteralNode, '  ', '  ')

  // sort splicers to keep the order of the original file
  const sortedSplicers = splicers.sort((a, b) => a.start === b.start ? 0 : a.start > b.start ? 1 : -1)

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

function setRootKeysSplicers (
  splicers: Splicer[],
  obj: Record<string, any>,
  config: Record<string, any>,
  objectLiteralNode: namedTypes.ObjectExpression,
  lineStartSpacer: string,
) {
  const objectLiteralStartIndex = (objectLiteralNode as any).start + 1
  // add values
  const objKeys = Object.keys(obj).filter((key) => ['boolean', 'number', 'string'].includes(typeof obj[key]))

  const keysToInsert = objKeys.filter((key) => !(key in config))

  debug('keys to instert %O', keysToInsert)

  if (keysToInsert.length) {
    const valuesInserted = `\n${lineStartSpacer}${ keysToInsert.map((key) => `${key}: ${JSON.stringify(obj[key])},`).join(`\n${lineStartSpacer}`)}`

    splicers.push({
      start: objectLiteralStartIndex,
      end: objectLiteralStartIndex,
      replaceString: valuesInserted,
    })
  }

  // update values
  const keysToUpdate = objKeys.filter((key) => key in config && config[key] !== obj[key])

  debug('keys to update %O', keysToUpdate)

  keysToUpdate.forEach(
    (key) => {
      const propertyToUpdate = propertyFromKey(objectLiteralNode, key)

      if (propertyToUpdate) {
        setSplicerToUpdateProperty(splicers, propertyToUpdate, config[key], obj[key], key, obj)
      }
    },
  )
}

function setSubKeysSplicers (
  splicers: Splicer[],
  obj: Record<string, any>,
  config: Record<string, any>,
  objectLiteralNode: namedTypes.ObjectExpression,
  lineStartSpacer: string,
  parentLineStartSpacer: string,
) {
  const objectLiteralStartIndex = (objectLiteralNode as any).start + 1

  const keysToUpdateWithObjects: string[] = []

  const objSubkeys = Object.keys(obj).filter((key) => typeof obj[key] === 'object').reduce((acc: Array<{parent: string, subkey: string}>, key) => {
    keysToUpdateWithObjects.push(key)
    Object.entries(obj[key]).forEach(([subkey, value]) => {
      if (['boolean', 'number', 'string'].includes(typeof value)) {
        acc.push({ parent: key, subkey })
      }
    })

    return acc
  }, [])

  // add values where the parent key needs to be created
  const subkeysToInsertWithoutKey = objSubkeys.filter((key) => !config[key.parent])
  const keysToInsertForSubKeys: Record<string, string[]> = {}

  subkeysToInsertWithoutKey.forEach((keyTuple) => {
    const subkeyList = keysToInsertForSubKeys[keyTuple.parent] || []

    subkeyList.push(keyTuple.subkey)
    keysToInsertForSubKeys[keyTuple.parent] = subkeyList
  })

  let subvaluesInserted = ''

  for (const key in keysToInsertForSubKeys) {
    subvaluesInserted += `\n${parentLineStartSpacer}${key}: {`
    keysToInsertForSubKeys[key].forEach((subkey) => {
      subvaluesInserted += `\n${parentLineStartSpacer}${lineStartSpacer}${subkey}: ${JSON.stringify(obj[key][subkey])},`
    })

    subvaluesInserted += `\n${parentLineStartSpacer}},`
  }

  if (subkeysToInsertWithoutKey.length) {
    splicers.push({
      start: objectLiteralStartIndex,
      end: objectLiteralStartIndex,
      replaceString: subvaluesInserted,
    })
  }

  // add/update values where parent key already exists
  keysToUpdateWithObjects.filter((key) => config[key]).forEach((key) => {
    const propertyToUpdate = propertyFromKey(objectLiteralNode, key)

    if (propertyToUpdate?.value.type === 'ObjectExpression') {
      setRootKeysSplicers(splicers, obj[key], config[key], propertyToUpdate.value, parentLineStartSpacer + lineStartSpacer)
    }
  })
}

function setSplicerToUpdateProperty (splicers: Splicer[],
  propertyToUpdate: namedTypes.ObjectProperty,
  originalValue: any,
  updatedValue: any,
  key: string,
  obj: Record<string, any>) {
  if (propertyToUpdate && (isPrimitive(propertyToUpdate.value) || isUndefinedOrNull(propertyToUpdate.value))) {
    splicers.push({
      start: (propertyToUpdate.value as any).start,
      end: (propertyToUpdate.value as any).end,
      replaceString: JSON.stringify(updatedValue),
    })
  } else {
    debug('error', propertyToUpdate?.value)
    throw errors.get('COULD_NOT_UPDATE_CONFIG_FILE', obj, `Value for \`${key}\` is not a primitive. Updating this value could break your config.`)
  }
}

function propertyFromKey (objectLiteralNode: namedTypes.ObjectExpression | undefined, key: string): namedTypes.ObjectProperty | undefined {
  return objectLiteralNode?.properties.find((prop) => {
    return prop.type === 'ObjectProperty' && prop.key.type === 'Identifier' && prop.key.name === key
  }) as namedTypes.ObjectProperty
}

function isPrimitive (value: NodePath['node']): value is namedTypes.NumericLiteral | namedTypes.StringLiteral | namedTypes.BooleanLiteral {
  return value.type === 'NumericLiteral' || value.type === 'StringLiteral' || value.type === 'BooleanLiteral'
}

function isUndefinedOrNull (value: NodePath['node']): value is namedTypes.Identifier {
  return value.type === 'Identifier' && ['undefined', 'null'].includes(value.name)
}

interface Splicer{
  start: number
  end: number
  replaceString: string
}
