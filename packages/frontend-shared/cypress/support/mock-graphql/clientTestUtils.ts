import type { NexusGenArgTypes } from '@packages/graphql/src/gen/nxs.gen'
import type { TypedDocumentNode } from '@urql/core'
import type { GraphQLResolveInfo, OperationTypeNode } from 'graphql'
import type { SetOptional } from 'type-fest'

import type {
  CodegenTypeMap,
} from '../generated/test-graphql-types.gen'
import type { ClientTestContext } from './clientTestContext'

export type TypesWithId = {
  [K in keyof CodegenTypeMap]: 'id' extends keyof CodegenTypeMap[K] ? K : never
}[keyof CodegenTypeMap]

type ArgsFor<T, K> = T extends { __typename: infer U }
  ? U extends keyof NexusGenArgTypes
    ? K extends keyof NexusGenArgTypes[U]
      ? NexusGenArgTypes[U][K]
      : unknown
    : unknown
  : unknown

type NullableKeys<T> = {
  [K in keyof Required<T>]: null extends T[K] ? Extract<K, string> : never
}[keyof T]

export type MaybeResolver<T> = SetOptional<{
  [K in Extract<keyof T, string>]: K extends 'id' | '__typename' ? T[K] : T[K] | (
    (source: unknown, args: ArgsFor<T, K>, ctx: ClientTestContext, info: GraphQLResolveInfo) => Partial<T[K]>
  )
}, NullableKeys<T>>

let nodeIdx: Partial<Record<TypesWithId, number>> = {}

export function resetTestNodeIdx () {
  nodeIdx = {}
}

export function testNodeId <T extends TypesWithId> (type: T, title?: string) {
  nodeIdx[type] = (nodeIdx[type] ?? 0) + 1

  const id = title ? `${type}:${nodeIdx[type]}:${title}` : `${type}:${nodeIdx[type]}`

  return {
    __typename: type,
    id: btoa(id),
  } as const
}

export function getOperationNameFromDocument<T extends TypedDocumentNode<any, any>> (document: T, type: OperationTypeNode) {
  const documentDefinition = document.definitions[0]

  if (documentDefinition.kind !== 'OperationDefinition') {
    throw new Error('expected operation')
  }

  if (documentDefinition.operation !== type) {
    throw new Error(`expected ${type} document`)
  }

  if (!documentDefinition.name) {
    throw new Error('document must have a name')
  }

  const name = documentDefinition.name.value

  return name
}
