import { GraphQLError } from 'graphql'
import type { NexusGenAbstractTypeMembers } from '../gen/nxs.gen'

class PublicError extends GraphQLError {}

export function base64Encode (str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64')
  }

  return btoa(str)
}

export function base64Decode (str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('utf-8')
  }

  return atob(str)
}

export function decodeNodeId<T extends NexusGenAbstractTypeMembers['Node']> (
  id: string,
  allowedTypes?: T | T[],
): { type: NexusGenAbstractTypeMembers['Node'], value: string } {
  const decoded = base64Decode(id)
  const [type, value] = decoded.split(':') as [string, string]

  function isAllowedType (val: string): val is T {
    if (!allowedTypes) {
      return true
    }

    return Array.isArray(allowedTypes)
      ? allowedTypes.includes(type as T)
      : type === allowedTypes
  }

  if (isAllowedType(type)) {
    return { type, value }
  }

  throw new PublicError(`Invalid ID, expected one of ${allowedTypes}`)
}

export function decodeNodeIds<T extends NexusGenAbstractTypeMembers['Node']> (
  ids: string[],
  allowedTypes: T | T[],
): { type: T, value: string }[] {
  return ids.map((id) => decodeNodeId(id, allowedTypes)) as {
    type: T
    value: string
  }[]
}
