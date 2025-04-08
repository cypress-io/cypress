import _ from 'lodash'
import { pipe, map } from 'wonka'
import { Client, subscriptionExchange, TypedDocumentNode, createClient, dedupExchange, errorExchange, ExecutionResult, gql } from '@urql/core'
import { executeExchange } from '@urql/exchange-execute'
import { makeCacheExchange } from '../../../src/graphql/urqlClient'
import { clientTestSchema } from './clientTestSchema'
import type { ClientTestContext } from './clientTestContext'
import type { GraphQLFieldResolver, GraphQLResolveInfo, GraphQLTypeResolver, FieldNode } from 'graphql'
import { defaultTypeResolver, introspectionFromSchema, isNonNullType } from 'graphql'
import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'
import { GQLStubRegistry } from './stubgql-Registry'
import { pathToArray } from 'graphql/jsutils/Path'
import dedent from 'dedent'
import type { ResultOf, VariablesOf } from '@graphql-typed-document-node/core'
import { getOperationNameFromDocument } from './clientTestUtils'

export type MutationResolverCallback<T extends TypedDocumentNode<any, any>> = (
  defineResult: (input: ResultOf<T>) => ResultOf<T>,
  variables: Exclude<VariablesOf<T>, undefined>) => ResultOf<T> | void

export type SubscriptionHook = (input: any) => void

export function testUrqlClient (context: ClientTestContext,
  onResult?: (result: any, context: ClientTestContext) => any,
  mutationResolvers?: Map<string, MutationResolverCallback<any>>,
  registerSubscriptionHook?: (name: string, hook: SubscriptionHook) => void): Client {
  return createClient({
    url: '/__cypress/graphql',
    exchanges: [

      dedupExchange,
      errorExchange({
        onError (error) {
          // eslint-disable-next-line
          console.error(error)
        },
      }),
      makeCacheExchange(introspectionFromSchema(clientTestSchema)),
      ({ forward }) => {
        return (ops$) => {
          return pipe(
            forward(ops$),
            map((result) => {
              Cypress.log({
                displayName: 'urql',
                message: result.operation.kind,
                consoleProps () {
                  return result
                },
              })?.end()

              if (mutationResolvers && result.operation.kind === 'mutation') {
                const firstMutation = result.operation.query.definitions[0]

                if (firstMutation.kind === 'OperationDefinition') {
                  const mutationName = firstMutation.name?.value
                  const mutationResolver = mutationName && mutationResolvers.get(mutationName)

                  if (mutationResolver) {
                    const val = mutationResolver((conf: any) => (conf), result.operation.variables)

                    if (val) {
                      result.data = val
                    }
                  }
                }
              }

              if (onResult) {
                if (result.data?.testFragmentMember) {
                  const val = onResult(result.data.testFragmentMember, context)

                  if (val !== undefined) {
                    result.data.testFragmentMember = val
                  }
                } else if (result.data?.testFragmentMemberList) {
                  const val = onResult(result.data.testFragmentMemberList, context)

                  if (val !== undefined) {
                    result.data.testFragmentMemberList = val
                  }
                }
              }

              return result
            }),
          )
        }
      },
      subscriptionExchange({
        forwardSubscription (op) {
          const parsed = gql(op.query)

          const subscriptionName = getOperationNameFromDocument(parsed, 'subscription')

          return {
            subscribe: (sink) => {
              if (registerSubscriptionHook) {
                registerSubscriptionHook(subscriptionName, (input: any) => {
                  const result: ExecutionResult = {
                    data: input,
                  }

                  sink.next(result)
                })
              }

              return {
                unsubscribe: () => { },
              }
            },
          }
        },
      }),
      executeExchange({
        schema: clientTestSchema,
        typeResolver: testTypeResolver,
        fieldResolver: testFieldResolver,
        context,
      }),
    ],
  })
}

const testTypeResolver: GraphQLTypeResolver<any, any> = function testTypeResolver (value, ctx, info, abstractType) {
  return defaultTypeResolver(value, ctx, info, abstractType)
}

const UNION_FIELD = ['testFragmentMember', 'testFragmentMemberList']

const testFieldResolver: GraphQLFieldResolver<any, ClientTestContext> = function testFieldResolver (source, args, ctx, info) {
  if (info.path.key === 'testFragmentMember') {
    return resolveFragmentMember(info)
  }

  if (info.path.key === 'testFragmentMemberList') {
    return resolveFragmentMemberList(args, info)
  }

  let directPath = pathToArray(info.path)

  if (UNION_FIELD.includes(directPath[0] as any)) {
    directPath = directPath.slice(1)
  }

  if (_.has(source, info.fieldName)) {
    let result = _.get(source, info.fieldName)

    if (_.isFunction(result)) {
      result = result(source, args, ctx, info)
    }

    return result
  }

  if (GQLStubRegistry[info.parentType.name] && source !== GQLStubRegistry[info.parentType.name]) {
    return testFieldResolver(GQLStubRegistry[info.parentType.name], args, ctx, info)
  }

  if (info.parentType.name.startsWith('RemoteFetchable')) {
    const typenameForRemoteFetchable = info.parentType.name.replace(/^RemoteFetchable/, '')

    // `data` serves as a wrapper field for remote fetches, so assume we actually want to grab a stubbed type if one exists
    if (info.fieldName === 'data') {
      const stubForRemoteFetchable = GQLStubRegistry[typenameForRemoteFetchable]

      if (stubForRemoteFetchable) {
        return stubForRemoteFetchable
      }
    }

    if (GQLStubRegistry[typenameForRemoteFetchable] && source !== GQLStubRegistry[typenameForRemoteFetchable]) {
      return testFieldResolver(GQLStubRegistry[typenameForRemoteFetchable], args, ctx, info)
    }
  }

  if (isNonNullType(info.returnType)) {
    throw new Error(dedent`
      Missing required field at path [${directPath.join('.')}] for fragment ${getMountedFragmentName(info)}.

      Fixes for this include:
        - Checking the GQLStubRegistry, ensure that a resolver exists for "${getResolvingTypename(info)}"
        - Modifying the "ctx" object in the 'setup' option passed to mountFragment / mountFragmentList

      Source: ${import.meta.url}
    `)
  }

  return null
}

function resolveFragmentMember (info: GraphQLResolveInfo) {
  const RESOLVING_TYPENAME = getResolvingTypename(info)
  const toResolve = {
    __typename: RESOLVING_TYPENAME,
    ...GQLStubRegistry[RESOLVING_TYPENAME],
  }

  return toResolve
}

function resolveFragmentMemberList (args: { count?: number }, info: GraphQLResolveInfo) {
  return _.times(args.count ?? 2, () => resolveFragmentMember(info))
}

function getMountedFragmentName (info: GraphQLResolveInfo) {
  const sel = info.operation.selectionSet.selections[0] as FieldNode
  const node = sel.selectionSet?.selections[0] as FieldNode

  return node.name.value
}

function getResolvingTypename (info: GraphQLResolveInfo) {
  const mountedFragmentName = getMountedFragmentName(info)
  const fragment = info.fragments[mountedFragmentName]

  return fragment.typeCondition.name.value as keyof CodegenTypeMap
}
