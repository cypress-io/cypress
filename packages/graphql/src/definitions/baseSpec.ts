// Not sure if this is a good idea
// Sharing definition between objectType and inputObjectType
// https://github.com/graphql-nexus/nexus/discussions/772
import type { InputDefinitionBlock, OutputDefinitionBlock } from 'nexus/dist/core'

export function baseSpecDefinition<N extends string> (t: InputDefinitionBlock<N> | OutputDefinitionBlock<N>) {
  t.nonNull.string('name')
  t.nonNull.string('relative')
  t.nonNull.string('absolute')
}
