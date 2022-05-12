import * as t from '@babel/types'
import type { WIZARD_BUNDLERS, WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
import { parse, visit } from 'recast'
import dedent from 'dedent'
import assert from 'assert'

/**
 * AST definition Node for:
 *
 * e2e: {
 *   setupNodeEvents(on, config) {
 *     // implement node event listeners here
 *   }
 * }
 */
export function addE2EDefinition (): t.ObjectProperty {
  return extractProperty(`
    const toMerge = {
      e2e: {
        setupNodeEvents(on, config) {
          // implement node event listeners here
        },
      }
    }
  `)
}

export interface ASTComponentDefinitionConfig {
  testingType: 'component'
  bundler: typeof WIZARD_BUNDLERS[number]['type']
  configPath?: string
  framework?: typeof WIZARD_FRAMEWORKS[number]['configFramework']
  needsExplicitConfig: boolean
}

/**
 * AST definition Node for:
 *
 * component: {
 *   devServer: {
 *     bundler: 'bundler',
 *     framework: 'framework',
 *   }
 * }
 */
export function addComponentDefinition (config: ASTComponentDefinitionConfig): t.ObjectProperty {
  const bundlers = {
    vite: {
      name: 'Vite',
      key: 'viteConfig',
    },
    webpack: {
      name: 'webpack',
      key: 'webpackConfig',
    },
  } as const

  if (config.bundler === 'webpack' && config.needsExplicitConfig && config.configPath) {
    return extractProperty(`
      const toMerge = {
        component: {
          devServer: {
            framework: ${config.framework ? `'${config.framework}'` : 'undefined'},
            bundler: '${config.bundler}',
            webpackConfig,
          },
        },
      }
    `)
  }

  if (config.bundler === 'vite' && config.needsExplicitConfig && config.configPath) {
    return extractProperty(`
      const toMerge = {
        component: {
          devServer: {
            framework: ${config.framework ? `'${config.framework}'` : 'undefined'},
            bundler: '${config.bundler}',
            viteConfig,
          },
        },
      }
    `)
  }

  if (config.needsExplicitConfig) {
    return extractProperty(`
      const toMerge = {
        component: {
          devServer: {
            framework: ${config.framework ? `'${config.framework}'` : 'undefined'},
            bundler: '${config.bundler}', 
            // provide your ${bundlers[config.bundler].name} config here...
            // ${bundlers[config.bundler].key},
          },
        },
      }
    `)
  }

  return extractProperty(`
    const toMerge = {
      component: {
        devServer: {
          framework: ${config.framework ? `'${config.framework}'` : 'undefined'},
          bundler: '${config.bundler}', 
        },
      },
    }
  `)
}

function extractProperty (str: string) {
  const toParse = parse(dedent(str), {
    parser: require('recast/parsers/typescript'),
  })

  let complete = false
  let toAdd: t.ObjectProperty | undefined

  visit(toParse, {
    visitObjectExpression (path) {
      if (complete) return false

      if (path.node.properties.length > 1 || !t.isObjectProperty(path.node.properties[0])) {
        throw new Error(`Can only parse an expression with a single property`)
      }

      toAdd = path.node.properties[0]
      complete = true

      return false
    },
  })

  assert(toAdd, `Missing property to merge into config from string: ${str}`)

  return toAdd
}

interface ESModuleToAdd {
  node: t.ImportDeclaration
  type: 'ES'
}

interface CommonJSModuleToAdd {
  node: t.Statement
  type: 'CommonJS'
}

export type ModuleToAdd = ESModuleToAdd | CommonJSModuleToAdd

/**
 * AST definition Node for:
 *
 * import webpackConfig from <file>
 */
export function addESModuleDefinition (file: string, identifier: 'viteConfig' | 'webpackConfig'): ESModuleToAdd {
  return {
    node: t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier(identifier))],
      t.stringLiteral(file),
    ),
    type: 'ES',
  }
}

/**
 * AST definition Node for:
 *
 * const webpackConfig = require(<file>)
 */
export function addCommonJSModuleDefinition (file: string, identifier: 'viteConfig' | 'webpackConfig'): CommonJSModuleToAdd {
  const parsed = parse(`const ${identifier} = require('${file}')`, {
    parser: require('recast/parsers/typescript'),
  }) as t.File

  return {
    node: parsed.program.body[0] as t.Statement,
    type: 'CommonJS',
  }
}
