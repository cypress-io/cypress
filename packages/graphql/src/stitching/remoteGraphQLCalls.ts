import { batchDelegateToSchema } from '@graphql-tools/batch-delegate'
import { execute, GraphQLResolveInfo, parse } from 'graphql'
import { remoteSchemaWrapped } from './remoteSchemaWrapped'
import type { NexusGenObjects } from '../gen/nxs.gen'
import type { Query as CloudQuery } from '../gen/cloud-source-types.gen'
import type { DataContext } from '@packages/data-context'
import { delegateToSchema } from '@graphql-tools/delegate'

type PotentialFields = Exclude<keyof CloudQuery, '__typename'>

interface FieldArgMapping {
  cloudProjectsBySlugs: string
}

interface DelegateToRemoteQueryBatchedConfig<F extends KnownBatchFields> {
  fieldName: F
  info: GraphQLResolveInfo
  rootValue?: object
  key?: FieldArgMapping[F]
  context: DataContext
}

type KnownBatchFields = PotentialFields & keyof FieldArgMapping

const FieldConfig: Record<KnownBatchFields, string> = {
  cloudProjectsBySlugs: 'slugs',
}

export function checkAuthQuery (context: DataContext) {
  return Promise.resolve(execute({
    schema: remoteSchemaWrapped,
    document: parse(`{ cloudViewer { id } }`),
    contextValue: context,
  })).then((result) => {
    if (!result.data?.cloudViewer) {
      context.coreData.user = null
      context.actions.auth.logout()
    }
  })
}

export function cloudProjectBySlug (slug: string, context: DataContext, info: GraphQLResolveInfo) {
  return delegateToRemoteQueryBatched({
    info,
    key: slug,
    fieldName: 'cloudProjectsBySlugs',
    context,
  })
}

export function delegateToRemoteQueryBatched<T extends KnownBatchFields> (config: DelegateToRemoteQueryBatchedConfig<T>): ArrVal<CloudQuery[T]> | null {
  try {
    return batchDelegateToSchema({
      schema: remoteSchemaWrapped,
      info: config.info,
      context: config.context,
      rootValue: config.rootValue ?? {},
      operation: 'query',
      fieldName: config.fieldName,
      key: config.key,
      argsFromKeys: (keys) => ({ [FieldConfig[config.fieldName]]: keys }),
    })
  } catch (e) {
    config.context.logError(e)

    return null
  }
}

export async function delegateToRemoteQuery <T extends keyof NexusGenObjects> (info: GraphQLResolveInfo, context: DataContext, rootValue = {}): Promise<NexusGenObjects[T] | null> {
  try {
    return delegateToSchema({
      schema: remoteSchemaWrapped,
      info,
      context,
      rootValue,
    })
  } catch (e) {
    context.logError(e)

    return null
  }
}
