import * as t from '@babel/types'
import * as babel from '@babel/core'
import fs from 'fs-extra'
import dedent from 'dedent'
import path from 'path'
import debugLib from 'debug'

import { addToCypressConfigPlugin } from './addToCypressConfigPlugin'
import { addComponentDefinition, addE2EDefinition, ASTComponentDefinitionConfig } from './astConfigHelpers'

const debug = debugLib('cypress:config:addToCypressConfig')

/**
 * Adds to the Cypress config, using the Babel AST utils.
 *
 * Injects the at the top of the config definition, based on the common patterns of:
 *
 * export default { ...
 *
 * export default defineConfig({ ...
 *
 * module.exports = { ...
 *
 * module.exports = defineConfig({ ...
 *
 * export = { ...
 *
 * export = defineConfig({ ...
 *
 * If we don't match one of these, we'll use the rest-spread pattern on whatever
 * the current default export of the file is:
 *
 * current:
 *    export default createConfigFn()
 *
 * becomes:
 *    export default {
 *      projectId: '...',
 *      ...createConfigFn()
 *    }
 */
export async function addToCypressConfig (filePath: string, code: string, toAdd: t.ObjectProperty) {
  try {
    const result = await babel.transformAsync(code, {
      babelrc: false,
      parserOpts: {
        errorRecovery: true,
        strictMode: false,
      },
      plugins: [
        addToCypressConfigPlugin(toAdd),
      ],
    })
    const transformedCode = result?.code

    if (!transformedCode) {
      throw new Error(`Unable to transform code`)
    }

    return transformedCode
  } catch (e) {
    debug(`Error adding properties to %s: %s`, filePath, e.stack)
    throw new Error(`Unable to automerge with the config file`)
  }
}

export interface AddProjectIdToCypressConfigOptions {
  filePath: string
  projectId: string
}

export async function addProjectIdToCypressConfig (options: AddProjectIdToCypressConfigOptions): Promise<AddToCypressConfigResult> {
  try {
    let result = await fs.readFile(options.filePath, 'utf8')
    const toPrint = await addToCypressConfig(options.filePath, result, t.objectProperty(
      t.identifier('projectId'),
      t.identifier(options.projectId),
    ))

    await fs.writeFile(options.filePath, maybeFormatWithPrettier(toPrint, options.filePath))

    return {
      result: 'ADDED',
    }
  } catch (e) {
    return {
      result: 'NEEDS_MERGE',
      error: e,
    }
  }
}

export interface AddToCypressConfigResult {
  result: 'ADDED' | 'NEEDS_MERGE'
  error?: Error
}

export interface AddTestingTypeToCypressConfigOptions {
  filePath: string
  info: ASTComponentDefinitionConfig | {
    testingType: 'e2e'
  }
}

export async function addTestingTypeToCypressConfig (options: AddTestingTypeToCypressConfigOptions): Promise<AddToCypressConfigResult> {
  try {
    let result: string | undefined = undefined

    try {
      result = await fs.readFile(options.filePath, 'utf8')
    } catch (e) {
      // If we can't find the file, or it's an empty file, let's create a new one
    }

    const pathExt = path.extname(options.filePath)

    // If for some reason they have deleted the contents of the file, we want to recover
    // gracefully by adding some default code to use as the AST here, based on the extension
    if (!result || result.trim() === '') {
      result = getEmptyCodeBlock(pathExt)
    }

    const toAdd = options.info.testingType === 'e2e' ? addE2EDefinition() : addComponentDefinition(options.info)
    const toPrint = await addToCypressConfig(options.filePath, result, toAdd)

    await fs.writeFile(options.filePath, maybeFormatWithPrettier(toPrint, options.filePath))

    return {
      result: 'ADDED',
    }
  } catch (e) {
    return {
      result: 'NEEDS_MERGE',
      error: e,
    }
  }
}

// Necessary to handle the edge case of them deleting the contents of their Cypress
// config file, just before we merge in the testing type
function getEmptyCodeBlock (outputType: string) {
  if (outputType === 'ts' || outputType === 'esm') {
    return dedent`
      import { defineConfig } from 'cypress'

      export default defineConfig({
        
      })
    `
  }

  return dedent`
    const { defineConfig } = require('cypress')

    module.exports = defineConfig({
      
    })
  `
}

function maybeFormatWithPrettier (code: string, filePath: string) {
  try {
    const prettierImportPath = require.resolve('prettier', { paths: [path.dirname(filePath)] })
    const prettier = require(prettierImportPath) as typeof import('prettier')

    return prettier.format(code, {
      filepath: filePath,
    })
  } catch {
    //
    return code
  }
}
