import { gql, TypedDocumentNode } from '@urql/core'
import { GraphQLOutputType, GraphQLResolveInfo, print, visit } from 'graphql'
import debugLib from 'debug'

import type { DataContext } from '../DataContext'
import type { Query, CloudRun } from '../gen/graphcache-config.gen'
import { Poller } from '../polling'
import { compact, isEqual, uniq } from 'lodash'

const debug = debugLib('cypress:data-context:sources:RelevantRunSpecsDataSource')

type PartialCloudRunWithId = Partial<CloudRun> & Pick<CloudRun, 'id'>

//Not ideal typing for this return since the query is not fetching all the fields, but better than nothing
export type RelevantRunSpecsCloudResult = {
  cloudNodesByIds: Array<PartialCloudRunWithId>
} & Pick<Query, 'pollingIntervals'>

/**
 * DataSource used to watch RUNNING CloudRuns for changes to provide
 * near real time updates to the app front end
 *
 * This DataSource backs the `relevantRunSpecChange` subscription by creating
 * a poller that will poll for changes for the set of runs. If the data
 * returned changes, it will emit a message on the subscription.
 */
export class RelevantRunSpecsDataSource {
  #pollingInterval: number = 15
  #cached = new Map<string, PartialCloudRunWithId>()
  #query?: TypedDocumentNode<any, object>

  #poller?: Poller<'relevantRunSpecChange', never, { runId: string, info: GraphQLResolveInfo }>

  constructor (private ctx: DataContext) {}

  specs (id: string): PartialCloudRunWithId | undefined {
    return this.#cached.get(id)
  }

  get pollingInterval () {
    return this.#pollingInterval
  }

  /**
  * Query for the set of CloudRuns by id
  * @param runIds for RUNNING CloudRuns that are being watched from the front end for changes
  */
  async getRelevantRunSpecs (runIds: string[]): Promise<PartialCloudRunWithId[]> {
    if (runIds.length === 0) {
      return []
    }

    debug(`Fetching runs %o`, runIds)

    const result = await this.ctx.cloud.executeRemoteGraphQL<RelevantRunSpecsCloudResult>({
      fieldName: 'cloudNodesByIds',
      operationDoc: this.#query!,
      operationVariables: {
        ids: runIds,
      },
      requestPolicy: 'network-only', // we never want to hit local cache for this request
    })

    if (result.error) {
      debug(`Error when fetching relevant runs for all runs: %o: error -> %o`, runIds, result.error)

      return []
    }

    const nodes = result.data?.cloudNodesByIds
    const pollingInterval = result.data?.pollingIntervals?.runByNumber

    debug(`Result returned - length: ${nodes?.length} pollingInterval: ${pollingInterval}`)

    if (pollingInterval) {
      this.#pollingInterval = pollingInterval
      if (this.#poller) {
        this.#poller.interval = this.#pollingInterval
      }
    }

    return nodes || []
  }

  pollForSpecs (runId: string, info: GraphQLResolveInfo) {
    debug(`pollForSpecs called`)
    //TODO Get spec counts before poll starts
    if (!this.#poller) {
      this.#poller = new Poller(this.ctx, 'relevantRunSpecChange', this.#pollingInterval, async (subscriptions) => {
        debug('subscriptions', subscriptions.length)

        const runIds = uniq(compact(subscriptions?.map((sub) => sub.meta?.runId)))

        debug('Polling for specs for runs: %o', runIds)

        const query = this.createQuery(compact(subscriptions.map((sub) => sub.meta?.info)))

        //debug('query', query)

        this.#query = query

        const runs = await this.getRelevantRunSpecs(runIds)

        debug(`Run data is `, runs)

        runs.forEach(async (run) => {
          if (!run) {
            return
          }

          const cachedRun = this.#cached.get(run.id)

          if (!cachedRun || !isEqual(run, cachedRun)) {
            debug(`Caching for id %s: %o`, run.id, run)
            this.#cached.set(run.id, { ...run })

            const cachedRelevantRuns = this.ctx.relevantRuns.cache

            if (run.runNumber === cachedRelevantRuns.selectedRunNumber) {
              const projectSlug = await this.ctx.project.projectId()

              debug(`Invalidate cloudProjectBySlug ${projectSlug}`)

              await this.ctx.cloud.invalidate('Query', 'cloudProjectBySlug', { slug: projectSlug })
              await this.ctx.emitter.relevantRunChange(cachedRelevantRuns)
            }

            this.ctx.emitter.relevantRunSpecChange(run)
          }
        })

        debug('processed runs')
      })
    }

    const fields = getFields(info)

    /**
     * Checks runs as they are emitted for the subscription to make sure they match what is
     * expected by the subscription they are attached to. First, verifies it is for the run
     * being watched by comparing IDs. Then also verifies that the fields match.  The field validation
     * was needed to prevent a race condition when attaching different subscriptions for the same
     * run that expect different fields.
     *
     * @param run check to see if it should be filtered out
     */
    const filter = (run: PartialCloudRunWithId) => {
      const runIdsMatch = run.id === runId
      const runFields = Object.keys(run)
      const hasAllFields = fields.every((field) => runFields.includes(field))

      debug('Calling filter %o', { runId, runIdsMatch, hasAllFields }, runFields, fields)

      return runIdsMatch && hasAllFields
    }

    return this.#poller.start({ meta: { runId, info }, filter })
  }

  createQuery (infos: GraphQLResolveInfo[]) {
    const fragmentSpreadName = 'Subscriptions'

    const allFragments = createFragments(infos, fragmentSpreadName)

    const document = `
      query RelevantRunSpecsDataSource_Specs(
        $ids: [ID!]!
      ) {
        cloudNodesByIds(ids: $ids) {
          id
          ... on CloudRun {
            ...${fragmentSpreadName}
          }
        }
        pollingIntervals {
          runByNumber
        }
      }

      ${allFragments.map((fragment) => `${print(fragment) }\n`).join('\n')}
    `

    return gql(document)
  }
}

/**
 * Creates an array of GraphQL fragments that represent each of the queries being requested for the set of subscriptions
 * that are using the poller created by this class
 *
 * @example
 * The set of fragments will look like the following with `combinedFragmentName` set to "Subscriptions"
 * and an array of 2 "infos" and the expected type of CloudRun:
 *
 * fragment Subscriptions on CloudRun  {
 *   ...Fragment0
 *   ...Fragment1
 * }
 *
 * fragment Fragment0 on CloudRun {
 *   { selections from the first GraphQLResolveInfo}
 * }
 *
 * fragment Fragment1 on CloudRun {
 *   { selections from the second GraphQLResolveInfo}
 * }
 *
 *
 * @param infos array of `GraphQLResolveInfo` objects for each subscription using this datasource
 * @param combinedFragmentName name for creating the fragment that combines together all the child fragments
 */
const createFragments = (infos: GraphQLResolveInfo[], combinedFragmentName: string) => {
  const fragments = infos.map((info, index) => createFragment(info, index))

  const fragmentNames = fragments.map((fragment) => fragment.name.value)

  const combinedFragment = createCombinedFragment(combinedFragmentName, fragmentNames, infos[0]!.returnType)

  return [combinedFragment, ...fragments]
}

/**
 * Generate a GraphQL fragment that uses the selections from the info parameter
 *
 * NOTE: any aliases for field names are removed since these will be
 * applied on the front end
 *
 * @example
 * fragment Fragment0 on CloudRun {
 *   { selections from the GraphQLResolveInfo}
 * }
 *
 * @param info to use for selections for the generated fragment
 * @param index value to use as suffix for the fragment name
 */
const createFragment = (info: GraphQLResolveInfo, index: number) => {
  const fragmentType = info.returnType.toString()

  //remove aliases
  const newFieldNode = visit(info.fieldNodes[0]!, {
    enter (node) {
      const newNode = {
        ...node,
        alias: undefined,
      }

      return newNode
    },
  })

  const selections = newFieldNode.selectionSet?.selections!

  return {
    kind: 'FragmentDefinition' as const,
    name: { kind: 'Name' as const, value: `Fragment${index}` },
    typeCondition: {
      kind: 'NamedType' as const,
      name: { kind: 'Name' as const, value: fragmentType },
    },
    selectionSet: {
      kind: 'SelectionSet' as const,
      selections,
    },
  }
}

/**
 * Generates a fragment that contains other fragment spreads
 *
 * @example
 * fragment CombinedFragment on Type {
 *  ...Fragment0
 *  ...Fragment1
 * }
 *
 * @param name name to be used for the fragment
 * @param fragmentNames array of names to generate fragment spreads
 * @param type of the fragment
 */
const createCombinedFragment = (name: string, fragmentNames: string[], type: GraphQLOutputType) => {
  return {
    kind: 'FragmentDefinition' as const,
    name: { kind: 'Name' as const, value: name },
    typeCondition: {
      kind: 'NamedType' as const,
      name: { kind: 'Name' as const, value: type.toString() },
    },
    selectionSet: {
      kind: 'SelectionSet' as const,
      selections: fragmentNames.map((fragmentName) => {
        return {
          kind: 'FragmentSpread' as const,
          name: { kind: 'Name' as const, value: fragmentName },
        }
      }),
    },
  }
}

/**
 * Get the field names for a given GraphQLResolveInfo
 * @param info to extract field names from
 */
const getFields = (info: GraphQLResolveInfo) => {
  const selections = info.fieldNodes[0]!.selectionSet?.selections!

  const fields = selections.map((selection) => selection.kind === 'Field' && selection.name.value).filter((field): field is string => typeof field === 'string')

  return fields
}
