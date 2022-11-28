import dedent from 'dedent'
import type { DocumentNode, GraphQLResolveInfo } from 'graphql'
import { dynamicOutputMethod, plugin, core, objectType, mutationField, idArg, list, nonNull, stringArg } from 'nexus'
import { createBatchResolver } from 'graphql-resolve-batch'

import type { NexusGenAbstractTypeMembers } from '../gen/nxs.gen'
import { RemoteFetchable } from '../schemaTypes'
import type { DataContext } from '@packages/data-context'
import type { CloudRemoteTargets, CloudQueryArgs, CloudQueryFields } from '../utils/graphqlTypeUtils'

export type RemoteFieldDefinitionConfig<TypeName extends string, FieldName extends string, RemoteField extends CloudQueryFields> = {
  /**
   * The type we expect to resolve as the "data"
   */
  type: CloudRemoteTargets
  /**
   * Args to make available to the field definition
   */
  args?: core.ArgsRecord
  /**
   * Optional description for the field
   */
  description?: string
  /**
   * Whether we should "eager-fetch" the data for the field when the field is first resolved.
   * Either a boolean (true), or called with the fetch
   * @default false
   */
  shouldEagerFetch?: boolean | ((
    source: core.RootValueField<TypeName, FieldName>,
    args: core.ArgsValue<TypeName, FieldName>,
    ctx: DataContext,
    info: GraphQLResolveInfo,
    index: number // Index, when resolving in a list. Useful to eager load the first "N" items
  ) => boolean)
  /**
   * The remote "query field" to delegate the query to
   */
  remoteQueryField: RemoteField
  /**
   * Given the "fieldNodes" for the type we're resolving, any arguments, and the remoteQueryField,
   * allows us to
   */
  makeQueryDocument?: () => DocumentNode
} & AdditionalRemoteFieldProps<TypeName, FieldName, RemoteField>

// If not every member of CloudQueryArgs is provided, then we will not issue the request
export type AdditionalRemoteFieldProps<TypeName extends string, FieldName extends string, RemoteField extends CloudQueryFields> = RemoteField extends never ? {
  queryArgs?: RemoteQueryArgsResolver<TypeName, FieldName, any>
} : {
  queryArgs: RemoteQueryArgsResolver<TypeName, FieldName, RemoteField>
}

export type RemoteQueryArgsResolver<TypeName extends string, FieldName extends string, RemoteField extends CloudQueryFields> = (
  source: core.SourceValue<TypeName>,
  args: core.ArgsValue<TypeName, FieldName>,
  ctx: DataContext,
  info: GraphQLResolveInfo
) => core.MaybePromise<CloudQueryArgs<RemoteField> | false>

export const remoteFieldPlugin = plugin({
  name: 'remoteFieldPlugin',
  description: 'Adds a container for an independently fetchable remote-resolved field',
  fieldDefTypes: [
    core.printedGenTypingImport({
      module: '@packages/graphql/src/plugins/nexusRemoteFieldPlugin',
      bindings: ['RemoteFieldDefinitionConfig'],
    }),
    core.printedGenTypingImport({
      module: '@packages/graphql/src/gen/cloud-source-types.gen',
      bindings: [['Query', 'CloudQuery']],
    }),
  ],
  onInstall (b) {
    b.addType(mutationField('loadRemoteFetchables', {
      description: 'Fetches the remote data for a RemoteFetchable ID',
      type: nonNull(list('RemoteFetchable')),
      args: {
        ids: nonNull(list(nonNull(idArg({
          description: 'The identifier for the RemoteFetchable we are loading',
        })))),
      },
      resolve: (source, args, ctx, info) => {
        // Each ID encodes all of the information necessary to resolve a remote fetchable,
        // we just need to unpack them and execute
        return args.ids.map((id) => ctx.remoteRequest.loadRemoteFetchable(id, ctx))
      },
    }))

    b.addType(dynamicOutputMethod({
      name: 'remoteField',
      typeDescription: dedent`
        Adds a field which is resolved with data from from the Cloud API.
        The "id" is refetchable via the loadRemoteFetchables APIs
      `,
      typeDefinition: dedent`
        <FieldName extends string, RemoteField extends Exclude<keyof CloudQuery, '__typename' | undefined>>(fieldName: FieldName, config: RemoteFieldDefinitionConfig<TypeName, FieldName, RemoteField>): void
      `,
      factory ({ typeName: parentTypeName, typeDef: t, args: factoryArgs, stage, builder, wrapping }) {
        const [fieldName, fieldConfig] = factoryArgs as [string, RemoteFieldDefinitionConfig<any, any, any>]
        const fieldType = `RemoteFetchable${fieldConfig.type}` as NexusGenAbstractTypeMembers['RemoteFetchable']

        if (!builder.hasType(fieldType)) {
          builder.addType(objectType({
            name: fieldType,
            description: `Wrapper for the resolution remote ${fieldType} data`,
            definition (t) {
              t.implements(RemoteFetchable)
              t.nonNull.id('id', {
                description: 'This ID is generated based on hashes of the queried data, and should be passed to the loadRemoteFetchables mutation to initiate loading the remote data',
                resolve: (source, args, ctx) => ctx.remoteRequest.makeRefetchableId(fieldType, source.operationHash, source.operationVariables),
              })

              t.field('data', {
                description: `Data resolved for the ${fieldType} from the cloud`,
                type: fieldConfig.type,
              })
            },
          }))
        }

        t.field(fieldName, {
          type: fieldType as any,
          description: fieldConfig.description ?? 'Wrapper for resolving remote data associated with this field',
          args: {
            ...fieldConfig.args ?? {},
            name: nonNull(stringArg({ description: 'A globally unique name for this field' })),
          },
          // Wrap with a batch resolver, so we aren't doing the same info parsing for each row
          resolve: createBatchResolver((sources, args, ctx, info) => {
            return ctx.remoteRequest.batchResolveRemoteFields(fieldConfig, sources, args, ctx, info)
          }),
        })
      },
    }))
  },
})
