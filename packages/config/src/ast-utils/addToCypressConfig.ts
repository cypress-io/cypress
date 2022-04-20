import * as t from '@babel/types'
import * as babel from '@babel/core'
import fs from 'fs-extra'
import dedent from 'dedent'
import path from 'path'

import { addToCypressConfigPlugin } from './addToCypressConfigPlugin'
import { addComponentDefinition, addE2EDefinition, ASTComponentDefinitionConfig } from './astConfigHelpers'

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
export async function addToCypressConfig (code: string, toAdd: t.ObjectProperty) {
  return babel.transformAsync(code, {
    babelrc: false,
    parserOpts: {
      errorRecovery: true,
      strictMode: false,
    },
    plugins: [
      addToCypressConfigPlugin(toAdd),
    ],
  })
}

export interface AddProjectIdToCypressConfigOptions {
  filePath: string
  projectId: string
}

export async function addProjectIdToCypressConfig (options: AddProjectIdToCypressConfigOptions) {
  try {
    let result = await fs.readFile(options.filePath, 'utf8')
    const { code: toPrint } = await addToCypressConfig(result, t.objectProperty(
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

export interface AddTestingTypeToCypressConfigFile {
  result: 'ADDED' | 'NEEDS_MERGE'
  error?: Error
}

export interface AddTestingTypeToCypressConfigOptions extends AddProjectIdToCypressConfigOptions {
  outputType: 'ts' | 'js' | 'esm'
  info: ASTComponentDefinitionConfig | {
    testingType: 'e2e'
  }
}

export async function addTestingTypeToCypressConfig (options: AddTestingTypeToCypressConfigOptions): Promise<AddTestingTypeToCypressConfigFile> {
  try {
    let result: string

    try {
      result = await fs.readFile(options.filePath, 'utf8')
    } catch {
      //
    }

    // If for some reason they have deleted the contents of the file, we want to recover
    // gracefully by adding some default code to use as the AST here, based on the outputType
    if (!result || result.trim() === '') {
      result = getEmptyCodeBlock(options.outputType)
    }

    const toAdd = options.info.testingType === 'e2e' ? addE2EDefinition() : addComponentDefinition(options.info)
    const { code: toPrint } = await addToCypressConfig(result, toAdd)

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
function getEmptyCodeBlock (outputType: 'js' | 'ts' | 'esm') {
  if (outputType === 'js') {
    return dedent`
    const { defineConfig } = require('cypress')

    module.exports = defineConfig({
      
    })
  `
  }

  return dedent`
    import { defineConfig } from 'cypress'

    export default defineConfig({
      
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
