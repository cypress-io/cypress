import { FieldResolver, plugin } from 'nexus'

// We know this is a valid node typename
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type $ValidatedByGraphQL = any;

export const nodePlugin = plugin({
  name: 'NodePlugin',
  objectTypeDefTypes: `
    node?: (TypeName extends keyof NexusGenRootTypes ? keyof NexusGenRootTypes[TypeName] : never) | core.FieldResolver<TypeName, 'id'>`,
  onObjectDefinition (def, { node }) {
    if (node != null) {
      let resolveFn: FieldResolver<string, string>

      if (typeof node === 'function') {
        resolveFn = (root, args, ctx, info) => {
          return ctx.makeId(
            def.typeName as $ValidatedByGraphQL,
            node(root, args, ctx, info),
          )
        }
      } else if (typeof node === 'string') {
        resolveFn = (root, args, ctx) => {
          return ctx.makeId(
            def.typeName as $ValidatedByGraphQL,
            assertNonNull(root[node]),
          )
        }
      } else {
        throw new Error(`Expected ${String(node)} to be a string or fn, saw.`)
      }

      def.implements('Node')
      def.nonNull.id('id', {
        description: `Relay style Node ID field for the ${def.typeName} field`,
        resolve: resolveFn,
      })
    }
  },
})

function assertNonNull<T> (val: T | null | undefined): T {
  if (val == null) {
    throw new Error(`Expected val to be non-null. This should never happen`)
  }

  return val as T
}
