import { CombinedError, stringifyVariables } from '@urql/core'
import type { NexusGenAbstractTypeMembers, NexusGenInterfaces, RemoteFetchableStatus } from '@packages/graphql/src/gen/nxs.gen'
import { DocumentNode, FieldNode, GraphQLResolveInfo, SelectionNode, visit, print, ArgumentNode, VariableDefinitionNode, TypeNode, ValueNode, parseType, VariableNode, GraphQLObjectType } from 'graphql'
import crypto from 'crypto'
import _ from 'lodash'
import type { DataContext } from '../DataContext'
import { pathToArray } from 'graphql/jsutils/Path'
import type { RemoteFieldDefinitionConfig, RemoteQueryArgsResolver } from '@packages/graphql/src/plugins'
import type { CloudExecuteQuery } from './CloudDataSource'
import assert from 'assert'
import type { RemoteFetchableShape } from '@packages/graphql/src/schemaTypes'
import { DocumentNodeBuilder } from '../util'

interface MaybeLoadRemoteFetchable extends CloudExecuteQuery {
  __typename: NexusGenAbstractTypeMembers['RemoteFetchable']
  id: string
  operationHash: string
  operation: string
  ctx: DataContext
  shouldFetch?: boolean
  remoteQueryField: string
  isMutation: boolean
  shouldBatch?: boolean
}

interface OperationDefinition {
  operation: string
  operationDoc: DocumentNode
  operationHash: string
  operationVariableDefs: [string, {type: TypeNode, defaultValue?: ValueNode}][]
  remoteQueryField: string
  fieldArgMapping: Record<string, string>
}

export class RemoteRequestDataSource {
  #operationErrors = new Map<string, CombinedError>()
  /** The remote execution definition for the query */
  #operationRegistry = new Map<string, OperationDefinition>()
  /**
   * Map<HASH_OF_QUERY, [FRONTEND_QUERY, VARIABLE_NAMES[]]>
   */
  #operationRegistryPushToFrontend = new Map<string, [string, string[]]>()

  /**
   * Given a RemoteFetchable "id", we look up the operation & resolve and/or
   * execute if it hasn't been fetched yet. Assumes the ID has already been
   * registered via a call to batchResolveRemoteFields
   */
  loadRemoteFetchable (id: string, ctx: DataContext): RemoteFetchableShape | Promise<never> {
    const { name, operationHash, operationVariables } = this.unpackFetchableNodeId(id)
    const operationResult = this.#operationRegistry.get(operationHash)

    if (!operationResult) {
      return Promise.reject(`Unable to execute RemoteFetchable for ${atob(id)}, are you sure you're using an ID that already came back from a resolved query?`)
    }

    const { operation, operationDoc, remoteQueryField } = operationResult

    return this.#maybeResolveFetchable({
      ctx,
      __typename: name as NexusGenAbstractTypeMembers['RemoteFetchable'],
      id,
      operation,
      operationDoc,
      operationHash,
      operationVariables,
      remoteQueryField,
      shouldFetch: true,
      isMutation: true,
      shouldBatch: true,
    })
  }

  #maybeResolveFetchable (params: MaybeLoadRemoteFetchable): RemoteFetchableShape {
    const { ctx, shouldFetch, ...partialResult } = params

    if (ctx.cloud.isResolving(params)) {
      return {
        ...partialResult,
        fetchingStatus: 'FETCHING',
      }
    }

    const errored = this.#operationErrors.get(params.id)

    if (errored) {
      // If we're fetching, and we've errored, refetch if we're in a mutation,
      // otherwise it'll just seem like it's fetching forever
      if (shouldFetch && params.isMutation) {
        this.#executeRemote(params)

        return {
          ...partialResult,
          fetchingStatus: 'FETCHING',
        }
      }

      return {
        ...partialResult,
        fetchingStatus: 'ERRORED',
        error: { ...errored },
      }
    }

    const cachedData = ctx.cloud.readFromCache(params)

    // If we have stale data, or we should fetch - fetch the data
    if (cachedData?.stale || shouldFetch) {
      // Otherwise, fetch it
      this.#executeRemote(params)

      return {
        ...partialResult,
        fetchingStatus: 'FETCHING',
      }
    }

    if (cachedData) {
      // If we have the data, but it's marked as stale (meaning this is a partial eager response)
      if (cachedData.stale) {
        // If we're not fetching, say it's not fetched but put the data under dataRaw for debugging
        return {
          ...partialResult,
          fetchingStatus: 'NOT_FETCHED',
          dataRaw: cachedData.data,
        }
      }

      // Otherwise, mark as fetched
      return {
        ...partialResult,
        fetchingStatus: 'FETCHED',
        data: cachedData.data?.[params.remoteQueryField],
        dataRaw: cachedData.data,
      }
    }

    if (!shouldFetch) {
      return {
        ...partialResult,
        fetchingStatus: 'NOT_FETCHED',
      }
    }

    // Otherwise, fetch it
    this.#executeRemote(params)

    return {
      ...partialResult,
      fetchingStatus: 'FETCHING',
    }
  }

  #executeRemote (params: MaybeLoadRemoteFetchable) {
    const { ctx, operationDoc, operationHash, operationVariables, remoteQueryField } = params

    Promise.resolve(ctx.cloud.executeRemoteGraphQL({
      fieldName: remoteQueryField,
      operationDoc,
      operationHash,
      operationVariables,
      requestPolicy: 'network-only',
      shouldBatch: params.shouldBatch,
    }))
    .then((result) => {
      const toPushDefinition = this.#operationRegistryPushToFrontend.get(operationHash)

      assert(toPushDefinition, `Missing fragment for ${operationHash}`)

      const [toSend, variableNames] = toPushDefinition

      let data: any = null
      let error: any = null
      let fetchingStatus: RemoteFetchableStatus = 'FETCHED'

      if (result.error) {
        fetchingStatus = 'ERRORED'
        error = { ...result.error }
        this.#operationErrors.set(params.id, result.error)
      } else if (result.data) {
        data = result.data[params.remoteQueryField]
        this.#operationErrors.delete(params.id)
      }

      if (data || error) {
        ctx.emitter.pushFragment([{
          target: params.__typename,
          fragment: toSend,
          variables: _.pick(operationVariables, variableNames),
          data: {
            id: params.id,
            fetchingStatus,
            data,
            error,
          },
          errors: result.errors,
        }])
      }
    })
    .catch((e) => {
      ctx.logTraceError(e)
    })
  }

  unpackFetchableNodeId (id: string) {
    const bufferString = this.#atob(id)
    const [name, operationHash, encodedArgs] = bufferString.split(':') as [string, string, string]
    const operationVariables = JSON.parse(this.#atob(encodedArgs))

    return {
      name,
      operationHash,
      operationVariables,
    }
  }

  #atob (encoded: string) {
    return Buffer.from(encoded, 'base64').toString('utf8')
  }

  #btoa (unencoded: string) {
    return Buffer.from(unencoded, 'utf8').toString('base64')
  }

  makeRefetchableId (fieldType: NexusGenAbstractTypeMembers['RemoteFetchable'], operationHash: string, operationVariables: any) {
    return this.#btoa(`${fieldType}:${operationHash}:${this.#btoa(stringifyVariables(operationVariables))}`)
  }

  batchResolveRemoteFields (
    fieldConfig: RemoteFieldDefinitionConfig<any, any, any>,
    sources: readonly any[],
    args: any,
    ctx: DataContext,
    info: GraphQLResolveInfo,
  ) {
    const fieldType = `RemoteFetchable${fieldConfig.type}` as NexusGenAbstractTypeMembers['RemoteFetchable']

    let operationDef: OperationDefinition | null = null

    return sources.map(async (source, i): Promise<NexusGenInterfaces['RemoteFetchable'] | null> => {
      if (!operationDef) {
        operationDef = this.#makeRemoteOperation(fieldConfig, ctx, info)
        if (!this.#operationRegistry.has(operationDef.operationHash)) {
          const FIELDS_TO_PUSH = ['id', 'status', 'error', 'data']

          const docBuilder = new DocumentNodeBuilder({
            isNode: true,
            isRemoteFetchable: true,
            parentType: info.schema.getType(fieldType) as GraphQLObjectType,
            fieldNodes: info.fieldNodes[0]?.selectionSet?.selections.filter((f) => f.kind === 'Field' && FIELDS_TO_PUSH.includes(f.name.value)) as FieldNode[],
            variableDefinitions: info.operation.variableDefinitions,
            operationName: info.operation.name?.value ?? info.fieldNodes.map((n) => n.name.value).sort().join('_'),
          })

          this.#operationRegistry.set(operationDef.operationHash, operationDef)
          this.#operationRegistryPushToFrontend.set(operationDef.operationHash, [print(docBuilder.clientWriteFragment), docBuilder.variableNames])
        }
      }

      const { operation, operationDoc, operationHash } = operationDef
      const operationVariables: Record<string, any> = {}
      const queryArgs = fieldConfig.queryArgs as RemoteQueryArgsResolver<any, any, any>

      if (typeof queryArgs === 'function') {
        const queryArgResult = await queryArgs(source, args, ctx, info)

        // If we explicitly return false from queryArgs, we aren't fetching
        if (queryArgResult === false) {
          return null
        }

        for (const [key, val] of Object.entries(queryArgResult)) {
          if (operationDef.fieldArgMapping[key]) {
            operationVariables[key] = val
          }
        }
      }

      for (const [name] of operationDef.operationVariableDefs) {
        operationVariables[name] ??= info.variableValues[name] ?? null
      }

      const shouldEagerFetch = typeof fieldConfig.shouldEagerFetch === 'function'
        ? fieldConfig.shouldEagerFetch(source, args, ctx, info, i)
        : fieldConfig.shouldEagerFetch ?? false

      const id = this.makeRefetchableId(fieldType, operationDef.operationHash, operationVariables)

      return this.#maybeResolveFetchable({
        ctx,
        __typename: fieldType,
        id,
        operation,
        operationDoc,
        operationHash,
        operationVariables,
        shouldFetch: shouldEagerFetch,
        remoteQueryField: fieldConfig.remoteQueryField,
        isMutation: false,
        shouldBatch: true,
      })
    })
  }

  #makeRemoteOperation (fieldConfig: RemoteFieldDefinitionConfig<any, any, any>, ctx: DataContext, info: GraphQLResolveInfo): OperationDefinition {
    const fieldNodes = this.#getDataFieldNodes(info)
    const referencedVariableValues = this.#getReferencedVariables(fieldNodes, info.operation.variableDefinitions ?? [])

    const queryFieldDef = ctx.config.schemaCloud.getQueryType()?.getFields()[fieldConfig.remoteQueryField]

    assert(queryFieldDef, `Unknown remote query field ${fieldConfig.remoteQueryField}`)

    const remoteFieldArgs = queryFieldDef.args

    const operationVariableDefs: [string, {type: TypeNode, defaultValue?: ValueNode}][] = []
    const fieldArgs: [string, ValueNode][] = []

    const fieldArgMapping: Record<string, string> = {}

    // Add the outer variables to thq query
    for (const [referencedVar, variableDef] of Object.entries(referencedVariableValues)) {
      operationVariableDefs.push([referencedVar, variableDef])
    }

    // Come up with names for the inner variables, ensuring they don't conflict
    // with the outer variables
    for (const fieldArg of remoteFieldArgs) {
      let toName = fieldArg.name

      while (referencedVariableValues[toName]) {
        toName += '_'
      }

      fieldArgMapping[fieldArg.name] = toName
      operationVariableDefs.push([toName, { type: parseType(fieldArg.type.toString()) }])
      const argVar: VariableNode = {
        kind: 'Variable',
        name: {
          kind: 'Name',
          value: toName,
        },
      }

      fieldArgs.push([toName, argVar])
    }

    const operationDoc = this.#makeOperationDoc({
      fieldName: fieldConfig.remoteQueryField,
      fieldArgs,
      fieldNodes,
      operationVariableDefs,
    })

    const operation = print(operationDoc)
    const operationHash = this.#sha1(operation)

    return {
      operation,
      operationDoc,
      operationHash,
      operationVariableDefs,
      fieldArgMapping,
      remoteQueryField: fieldConfig.remoteQueryField,
    }
  }

  #sha1 (str: string) {
    return crypto.createHash('sha1').update(str).digest('hex')
  }

  // Gather the referenced variables from each of the field nodes we
  // are generating a query with
  #getReferencedVariables (selectionNodes: readonly SelectionNode[], outerVariableDefs: readonly VariableDefinitionNode[]) {
    const variableDefinitions: Record<string, {type: TypeNode, defaultValue?: ValueNode}> = {}

    selectionNodes.map((node) => {
      visit(node, {
        Variable (node) {
          const def = variableDefinitions[node.name.value] ?? outerVariableDefs.find((d) => d.variable.name.value === node.name.value)

          assert(def, `Expected allVariableDefinitions for ${node.name.value}`)
          variableDefinitions[node.name.value] = def
        },
      })
    })

    return variableDefinitions
  }

  #getDataFieldNodes (info: GraphQLResolveInfo) {
    const dataSelection = info.fieldNodes[0]?.selectionSet?.selections.filter((s) => {
      return s.kind === 'Field' && s.name.value === 'data'
    }) as FieldNode[]

    if (dataSelection.length > 1) {
      throw new Error(`Cannot alias the data field, at ${dataSelection?.map(print)}`)
    }

    const selections = dataSelection[0]?.selectionSet?.selections

    if (!selections) {
      throw new Error(`Cannot resolve ${info.operation.name?.value} without a selection for data, at: ${pathToArray(info.path)}`)
    }

    return selections
  }

  #makeOperationDoc (
    params: {
      fieldName: string
      fieldArgs: [string, ValueNode][]
      fieldNodes: readonly SelectionNode[]
      operationVariableDefs: [string, {type: TypeNode, defaultValue?: ValueNode}][]
    },
  ): DocumentNode {
    const { operationVariableDefs = [], fieldArgs = [] } = params

    return {
      kind: 'Document',
      definitions: [
        {
          kind: 'OperationDefinition',
          operation: 'query',
          name: {
            kind: 'Name',
            value: `RemoteRequest_${params.fieldName}`,
          },
          variableDefinitions: operationVariableDefs.map((v): VariableDefinitionNode => {
            return {
              kind: 'VariableDefinition',
              variable: {
                kind: 'Variable',
                name: { kind: 'Name', value: v[0] },
              },
              type: v[1].type,
              defaultValue: v[1].defaultValue,
            }
          }),
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              {
                kind: 'Field',
                name: {
                  kind: 'Name',
                  value: params.fieldName,
                },
                arguments: fieldArgs.map((a): ArgumentNode => {
                  return {
                    kind: 'Argument',
                    name: { kind: 'Name', value: a[0] },
                    value: a[1],
                  }
                }),
                selectionSet: {
                  kind: 'SelectionSet',
                  selections: params.fieldNodes,
                },
              },
            ],
          },
        },
      ],
    }
  }
}
