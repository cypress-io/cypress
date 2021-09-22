import type { CodegenPlugin } from '@graphql-codegen/plugin-helpers'
import { isInterfaceType, isObjectType } from 'graphql'

const plugin: CodegenPlugin<any> = {
  plugin: (schema, documents, config, info) => {
    const typesMap = schema.getTypeMap()

    let typeMap: string[] = []
    let resolveTypeMap: string[] = []

    for (const [typeName, type] of Object.entries(typesMap)) {
      if (!typeName.startsWith('__') && isObjectType(type) || isInterfaceType(type)) {
        typeMap.push(`  ${typeName}: ${typeName},`)
        resolveTypeMap.push(`  ${typeName}: MaybeResolver<${typeName}>,`)
      }
    }

    return [
      `import type { GraphQLResolveInfo } from 'graphql'`,
      'export type MaybeResolver<T> = {',
      `  [K in keyof T]: K extends 'id' | '__typename' ? T[K] : T[K] | ((args: any, ctx: object, info: GraphQLResolveInfo) => MaybeResolver<T[K]>)`,
      '}',
      '',
      `export interface CodegenTypeMap {`,
      typeMap.join('\n'),
      `}`,
      '',
      `export interface CodegenResolveTypeMap {`,
      resolveTypeMap.join('\n'),
      '}',
    ].join('\n')
  },
}

export default plugin
