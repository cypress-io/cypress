import * as t from '@babel/types'
import traverse from '@babel/traverse'
import fs from 'fs-extra'
import dedent from 'dedent'
import path from 'path'
import debugLib from 'debug'
import { parse, print } from 'recast'
import prettier from 'prettier'

import { addToCypressConfigPlugin } from './addToCypressConfigPlugin'
import { addComponentDefinition, addE2EDefinition, ASTComponentDefinitionConfig } from './astConfigHelpers'

const debug = debugLib('cypress:config:addToCypressConfig')

/**
 * Adds to the Cypress config, using the Babel AST utils.
 *
 * Injects the export at the top of the config definition, based on the common patterns of:
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
    const ast = parse(code, {
      parser: require('recast/parsers/typescript'),
    })

    traverse(ast, addToCypressConfigPlugin(toAdd).visitor)

    return print(ast).code
  } catch (e) {
    debug(`Error adding properties to %s: %s`, filePath, e.stack)
    throw new Error(`Unable to automerge with the config file`)
  }
}

export interface AddProjectIdToCypressConfigOptions {
  filePath: string
  projectId: string
}

export async function addProjectIdToCypressConfig (options: AddProjectIdToCypressConfigOptions) {
  try {
    let result = await fs.readFile(options.filePath, 'utf8')
    const toPrint = await addToCypressConfig(options.filePath, result, t.objectProperty(
      t.identifier('projectId'),
      t.identifier(options.projectId),
    ))

    await fs.writeFile(options.filePath, maybeFormatWithPrettier(toPrint, options.filePath))

    return {
      result: 'MERGED',
    }
  } catch (e) {
    return {
      result: 'NEEDS_MERGE',
      error: e,
    }
  }
}

export interface AddToCypressConfigResult {
  result: 'ADDED' | 'MERGED' | 'NEEDS_MERGE'
  error?: Error
  codeToMerge?: string
}

export interface AddTestingTypeToCypressConfigOptions {
  filePath: string
  info: ASTComponentDefinitionConfig | {
    testingType: 'e2e'
  }
}

export async function addTestingTypeToCypressConfig (options: AddTestingTypeToCypressConfigOptions): Promise<AddToCypressConfigResult> {
  const toAdd = options.info.testingType === 'e2e' ? addE2EDefinition() : addComponentDefinition(options.info)

  try {
    let result: string | undefined = undefined
    let resultStatus: 'ADDED' | 'MERGED' = 'MERGED'

    try {
      result = await fs.readFile(options.filePath, 'utf8')
    } catch (e) {
      // If we can't find the file, or it's an empty file, let's create a new one
    }

    const pathExt = path.extname(options.filePath)

    // If for some reason they have deleted the contents of the file, we want to recover
    // gracefully by adding some default code to use as the AST here, based on the extension
    if (!result || result.trim() === '') {
      resultStatus = 'ADDED'
      result = getEmptyCodeBlock(pathExt as OutputExtension)
    }

    const toPrint = await addToCypressConfig(options.filePath, result, toAdd)

    await fs.writeFile(options.filePath, maybeFormatWithPrettier(toPrint, options.filePath))

    return {
      result: resultStatus,
    }
  } catch (e) {
    return {
      result: 'NEEDS_MERGE',
      error: e,
      codeToMerge: print(toAdd).code,
    }
  }
}

type OutputExtension = '.ts' | '.mjs' | '.js'

// Necessary to handle the edge case of them deleting the contents of their Cypress
// config file, just before we merge in the testing type
function getEmptyCodeBlock (outputType: OutputExtension) {
  if (outputType === '.ts' || outputType === '.mjs') {
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
    return prettier.format(code, {
      filepath: filePath,
    })
  } catch {
    //
    return code
  }
}
