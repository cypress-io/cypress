import { batchDelegateToSchema } from '@graphql-tools/batch-delegate'
import type { GraphQLResolveInfo } from 'graphql'
import { remoteSchemaWrapped } from './remoteSchemaWrapped'
import type { Query as CloudQuery } from '../gen/cloud-source-types.gen'
import type { DataContext } from '@packages/data-context'
import { pathToArray } from 'graphql/jsutils/Path'

type ArrVal<T> = T extends Array<infer U> ? U : never

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

const IS_PROD = process.env.CYPRESS_INTERNAL_CLOUD_ENV === 'production'

export function cloudProjectBySlug (slug: string, context: DataContext, info: GraphQLResolveInfo) {
  return delegateToRemoteQueryBatched<'cloudProjectsBySlugs'>({
    info,
    key: slug,
    fieldName: 'cloudProjectsBySlugs',
    context,
  })
}

export async function delegateToRemoteQueryBatched<T extends KnownBatchFields> (config: DelegateToRemoteQueryBatchedConfig<T>): Promise<ArrVal<CloudQuery[T]> | null | Error> {
  try {
    return await batchDelegateToSchema({
      schema: remoteSchemaWrapped,
      info: config.info,
      context: config.context,
      rootValue: config.rootValue ?? {},
      operation: 'query',
      operationName: `${config.info.operation.name?.value ?? 'Unnamed'}_${pathToArray(config.info.path).join('_')}_batched`,
      fieldName: config.fieldName,
      key: config.key,
      argsFromKeys: (keys) => ({ [FieldConfig[config.fieldName]]: keys }),
    })
  } catch (e) {
    if (IS_PROD) {
      config.context.logTraceError(e)

      return null
    }

    return e as Error
  }
}
