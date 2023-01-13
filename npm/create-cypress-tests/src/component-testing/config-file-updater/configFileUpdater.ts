import { parse } from '@babel/parser'
import type { File } from '@babel/types'
import type { NodePath } from 'ast-types/lib/node-path'
import { visit } from 'recast'
import type { namedTypes } from 'ast-types'
import * as fs from 'fs-extra'
import { prettifyCode } from '../../utils'

export async function insertValuesInConfigFile (filePath: string, obj: Record<string, any> = {}) {
  await insertValuesInJavaScript(filePath, obj)

  return true
}

export async function insertValuesInJavaScript (filePath: string, obj: Record<string, any>) {
  const fileContents = await fs.readFile(filePath, { encoding: 'utf8' })

  let finalCode = await insertValueInJSString(fileContents, obj)

  const prettifiedCode = await prettifyCode(finalCode)

  if (prettifiedCode) {
    finalCode = prettifiedCode
  }

  await fs.writeFile(filePath, finalCode)
}

export async function insertValueInJSString (fileContents: string, obj: Record<string, any>): Promise<string> {
  const ast = parse(fileContents, { plugins: ['typescript'], sourceType: 'module' })

  let objectLiteralNode: namedTypes.ObjectExpression | undefined

  function handleExport (nodePath: NodePath<namedTypes.CallExpression, any> | NodePath<namedTypes.ObjectExpression, any>): void {
    if (nodePath.node.type === 'CallExpression'
        && nodePath.node.callee.type === 'Identifier') {
      const functionName = nodePath.node.callee.name

      if (isDefineConfigFunction(ast, functionName)) {
        return handleExport(nodePath.get('arguments', 0))
      }
    }

    if (nodePath.node.type === 'ObjectExpression' && !nodePath.node.properties.find((prop) => prop.type !== 'ObjectProperty')) {
      objectLiteralNode = nodePath.node

      return
    }

    throw new Error('Cypress was unable to add/update values in your configuration file.')
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
    throw new Error('Cypress was unable to add/update values in your configuration file.')
  }

  setRootKeysSplicers(splicers, obj, objectLiteralNode!, '  ')
  setSubKeysSplicers(splicers, obj, objectLiteralNode!, '  ', '  ')

  // sort splicers to keep the order of the original file
  const sortedSplicers = splicers.sort((a, b) => a.start === b.start ? 0 : a.start > b.start ? 1 : -1)

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
  objectLiteralNode: namedTypes.ObjectExpression,
  lineStartSpacer: string,
) {
  const objectLiteralStartIndex = (objectLiteralNode as any).start + 1
  // add values
  const objKeys = Object.keys(obj).filter((key) => ['boolean', 'number', 'string'].includes(typeof obj[key]))

  // update values
  const keysToUpdate = objKeys.filter((key) => {
    return objectLiteralNode.properties.find((prop) => {
      return prop.type === 'ObjectProperty'
        && prop.key.type === 'Identifier'
        && prop.key.name === key
    })
  })

  keysToUpdate.forEach(
    (key) => {
      const propertyToUpdate = propertyFromKey(objectLiteralNode, key)

      if (propertyToUpdate) {
        setSplicerToUpdateProperty(splicers, propertyToUpdate, obj[key], key, obj)
      }
    },
  )

  const keysToInsert = objKeys.filter((key) => !keysToUpdate.includes(key))

  if (keysToInsert.length) {
    const valuesInserted = `\n${lineStartSpacer}${ keysToInsert.map((key) => `${key}: ${JSON.stringify(obj[key])},`).join(`\n${lineStartSpacer}`)}`

    splicers.push({
      start: objectLiteralStartIndex,
      end: objectLiteralStartIndex,
      replaceString: valuesInserted,
    })
  }
}

function setSubKeysSplicers (
  splicers: Splicer[],
  obj: Record<string, any>,
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
  const subkeysToInsertWithoutKey = objSubkeys.filter(({ parent }) => {
    return !objectLiteralNode.properties.find((prop) => {
      return prop.type === 'ObjectProperty'
        && prop.key.type === 'Identifier'
        && prop.key.name === parent
    })
  })
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
  keysToUpdateWithObjects.filter((parent) => {
    return objectLiteralNode.properties.find((prop) => {
      return prop.type === 'ObjectProperty'
        && prop.key.type === 'Identifier'
        && prop.key.name === parent
    })
  }).forEach((key) => {
    const propertyToUpdate = propertyFromKey(objectLiteralNode, key)

    if (propertyToUpdate?.value.type === 'ObjectExpression') {
      setRootKeysSplicers(splicers, obj[key], propertyToUpdate.value, parentLineStartSpacer + lineStartSpacer)
    }
  })
}

function setSplicerToUpdateProperty (splicers: Splicer[],
  propertyToUpdate: namedTypes.ObjectProperty,
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
    throw new Error('Cypress was unable to add/update values in your configuration file.')
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
