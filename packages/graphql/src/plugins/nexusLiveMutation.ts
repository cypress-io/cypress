import type { GraphQLResolveInfo } from 'graphql'
import { core, dynamicOutputMethod, plugin } from 'nexus'

export type LiveMutationResolver<
  TypeName extends string,
  FieldName extends string
> = (
  root: core.SourceValue<TypeName>,
  args: core.ArgsValue<TypeName, FieldName>,
  context: core.GetGen<'context'>,
  info: GraphQLResolveInfo
) => Promise<string | void> | void

export type LiveMutationFieldOpts<
  TypeName extends string,
  FieldName extends string
> = {
  type?: 'String'
  nonNull?: boolean
  description?: string
  list?: never
  args?: core.ArgsRecord
  resolve: LiveMutationResolver<TypeName, FieldName>
}

export const NexusLiveMutationPlugin = plugin({
  name: 'liveMutation',
  fieldDefTypes: [
    core.printedGenTypingImport({
      module: '@packages/graphql/src/plugins',
      bindings: ['LiveMutationFieldOpts'],
    }),
  ],
  onInstall (builder) {
    builder.addType(
      dynamicOutputMethod({
        name: 'liveMutation',
        typeDescription: 'A mutation which signals to the frontend to refetch',
        typeDefinition: `<FieldName extends string>(
          fieldName: FieldName, 
          config: LiveMutationFieldOpts<TypeName, FieldName>
        ): void;`,
        factory ({ typeDef: t, args }) {
          if (t.typeName !== 'Mutation') {
            throw new Error(`t.liveMutation can only be used on a Mutation`)
          }

          const [fieldName, config] = args as [
            string,
            LiveMutationFieldOpts<string, string>
          ]

          const { resolve, type, nonNull, ...rest } = config

          t[nonNull ? 'nonNull' : 'nullable'].field(fieldName, {
            type: type ?? 'Boolean',
            ...rest,
            resolve: async (root, args, ctx, info) => {
              const value = await resolve(root, args, ctx, info)

              ctx.emitter.toApp()
              ctx.emitter.toLaunchpad()

              return value ?? true
            },
          })
        },
      }),
    )
  },
})
