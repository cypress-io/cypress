import type {
  CodegenTypeMap,
} from '../generated/test-graphql-types.gen'

export type TypesWithId = {
  [K in keyof CodegenTypeMap]: 'id' extends keyof CodegenTypeMap[K] ? K : never
}[keyof CodegenTypeMap]

let nodeIdx: Partial<Record<TypesWithId, number>> = {}

export function testNodeId <T extends TypesWithId> (type: T) {
  nodeIdx[type] = (nodeIdx[type] ?? 0) + 1

  return {
    __typename: type,
    id: btoa(`${type}:${nodeIdx[type]}`),
  } as const
}
