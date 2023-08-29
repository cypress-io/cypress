import * as t from '@babel/types'
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
  bundler: 'vite' | 'webpack'
  framework?: string
  specPattern?: string
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
  const componentConfig = JSON.stringify({
    component: {
      devServer: {
        framework: config.framework,
        bundler: config.bundler,
      },
      specPattern: config.specPattern,
    },
  }, null, 2)

  return extractProperty(`
    const toMerge = ${componentConfig}
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

      if (path.node.properties.length > 1 || !t.isObjectProperty(path.node.properties[0] as t.ObjectProperty)) {
        throw new Error(`Can only parse an expression with a single property`)
      }

      toAdd = path.node.properties[0] as t.ObjectProperty
      complete = true

      return false
    },
  })

  assert(toAdd, `Missing property to merge into config from string: ${str}`)

  return toAdd
}
