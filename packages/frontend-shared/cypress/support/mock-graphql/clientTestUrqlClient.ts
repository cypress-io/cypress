import _ from 'lodash'
import { pipe, map } from 'wonka'
import { Client, createClient, dedupExchange, errorExchange } from '@urql/core'
import { executeExchange } from '@urql/exchange-execute'
import { makeCacheExchange } from '@packages/frontend-shared/src/graphql/urqlClient'
import { clientTestSchema } from './clientTestSchema'
import type { ClientTestContext } from './clientTestContext'
import { defaultTypeResolver, FieldNode, GraphQLFieldResolver, GraphQLResolveInfo, GraphQLTypeResolver, isNonNullType } from 'graphql'
import { stubApp } from './stubgql-App'
import { stubWizard } from './stubgql-Wizard'
import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'
import { stubNavigationItem, stubNavigationMenu } from './stubgql-NavigationMenu'
import { stubMutation } from './stubgql-Mutation'
import { pathToArray } from 'graphql/jsutils/Path'
import dedent from 'dedent'
import { stubQuery } from './stubgql-Query'
import { stubGlobalProject, stubProject } from './stubgql-Project'
import { CloudOrganizationStubs, CloudProjectStubs, CloudRecordKeyStubs, CloudRunStubs } from './stubgql-CloudTypes'

type MaybeResolveMap = {[K in keyof CodegenTypeMap]: MaybeResolver<CodegenTypeMap[K]>}

const GQLStubRegistry: Partial<MaybeResolveMap> = {
  App: stubApp,
  Wizard: stubWizard,
  NavigationMenu: stubNavigationMenu,
  ProjectLike: stubProject,
  GlobalProject: stubGlobalProject,
  CurrentProject: stubProject,
  Mutation: stubMutation,
  NavigationItem: stubNavigationItem,
  Query: stubQuery,
  CloudOrganization: CloudOrganizationStubs.cyOrg,
  CloudProject: CloudProjectStubs.componentProject,
  CloudRun: CloudRunStubs.allPassing,
  CloudRecordKey: CloudRecordKeyStubs.componentProject,
}

export function testUrqlClient (context: ClientTestContext, onResult?: (result: any, context: ClientTestContext) => any): Client {
  return createClient({
    url: '/graphql',
    exchanges: [
      dedupExchange,
      errorExchange({
        onError (error) {
          // eslint-disable-next-line
          console.error(error)
        },
      }),
      makeCacheExchange(),
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
              }).end()

              if (onResult) {
                if (result.data.testFragmentMember) {
                  const val = onResult(result.data.testFragmentMember, context)

                  if (val !== undefined) {
                    result.data.testFragmentMember = val
                  }
                } else if (result.data.testFragmentMemberList) {
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
