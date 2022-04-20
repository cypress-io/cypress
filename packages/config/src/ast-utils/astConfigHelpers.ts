import * as t from '@babel/types'

/**
 * AST definition Node for:
 *
 * e2e: {}
 */
export function addE2EDefinition (): t.ObjectProperty {
  return t.objectProperty(t.identifier('e2e'), t.objectExpression([]))
}

export interface ASTComponentDefinitionConfig {
  testingType: 'component'
  bundler: 'vite' | 'webpack'
  framework?: string
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
  const properties: Parameters<typeof t['objectExpression']>[0] = [
    t.objectProperty(t.identifier('bundler'), t.stringLiteral(config.bundler)),
  ]

  if (config.framework) {
    properties.push(t.objectProperty(t.identifier('framework'), t.stringLiteral(config.framework)))
  }

  return t.objectProperty(t.identifier('component'), t.objectExpression([
    t.objectProperty(t.identifier('devServer'), t.objectExpression(properties)),
  ]))
}
