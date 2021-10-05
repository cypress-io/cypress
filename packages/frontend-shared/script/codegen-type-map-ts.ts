import type { CodegenPlugin } from '@graphql-codegen/plugin-helpers'
import { isInterfaceType, isObjectType } from 'graphql'

const plugin: CodegenPlugin<any> = {
  plugin: (schema, documents, config, info) => {
    const typesMap = schema.getTypeMap()

    let typeMap: string[] = []

    for (const [typeName, type] of Object.entries(typesMap)) {
      if (!typeName.startsWith('__') && isObjectType(type) || isInterfaceType(type)) {
        typeMap.push(`  ${typeName}: ${typeName},`)
      }
    }

    return [
      `export interface CodegenTypeMap {`,
      typeMap.join('\n'),
      `}`,
      '',
    ].join('\n')
  },
}

export default plugin
