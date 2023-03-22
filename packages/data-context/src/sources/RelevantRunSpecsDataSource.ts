import { gql, TypedDocumentNode } from '@urql/core'
import { GraphQLOutputType, GraphQLResolveInfo, print, visit } from 'graphql'
import debugLib from 'debug'

import type { DataContext } from '../DataContext'
import type { Query, CloudRun } from '../gen/graphcache-config.gen'
import { Poller } from '../polling'
import { compact, uniq } from 'lodash'

const debug = debugLib('cypress:data-context:sources:RelevantRunSpecsDataSource')

// RelevantRunSpecsDataSource_Runs
//Not ideal typing for this return since the query is not fetching all the fields, but better than nothing
export type RelevantRunSpecsCloudResult = {
  cloudNodesByIds: Array<Partial<CloudRun>>
} & Pick<Query, 'pollingIntervals'>

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunSpecsDataSource {
  #pollingInterval: number = 15
  #cached = new Map<string, Partial<CloudRun>>()
  #query?: TypedDocumentNode<any, object>

  #poller?: Poller<'relevantRunSpecChange', never, { runId: string, info: GraphQLResolveInfo }>

  constructor (private ctx: DataContext) {}

  specs (id: string): Partial<CloudRun> | undefined {
    return this.#cached.get(id)
  }

  /**
   * Pulls the specs that matches a set of runs.
   * @param runs - array of shas to poll for.
   * TODO: This should be runNumbers, but we cannot query for multiple runNumbers.
   * TODO: Add that to cloud? Or, for loop on runNumber($runNumber) ...
   */
  async getRelevantRunSpecs (runIds: string[]): Promise<Partial<CloudRun>[]> {
    if (runIds.length === 0) {
      return []
    }

    debug(`Fetching runs %o`, runIds)

    const result = await this.ctx.cloud.executeRemoteGraphQL<RelevantRunSpecsCloudResult>({
      fieldName: 'cloudNodesByIds',
      operationDoc: this.#query!,
      operation: print(this.#query!),
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
        debug('subscriptions', subscriptions)
        const runIds = uniq(compact(subscriptions?.map((sub) => sub.meta?.runId)))

        debug('Polling for specs for runs: %o - runIds: %o', runIds)

        const query = this.createQuery(compact(subscriptions.map((sub) => sub.meta?.info)))

        //debug('query', query)

        this.#query = query

        const runs = await this.getRelevantRunSpecs(runIds)

        debug(`Run data is `, runs)

        runs?.forEach((run) => {
          debug(`Caching for id %s: %o`, run.id, run)

          this.#cached.set(run.id!, run)
        })

        runs.forEach((run) => {
          //TODO wrap subscription with filter
          this.ctx.emitter.relevantRunSpecChange(run)
        })
      })
    }

    const filter = (run: Partial<CloudRun>) => {
      debug('calling filter', run.id, runId)

      return run.id === runId
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

    //debug('document', document)

    return gql(document)
  }
}

const createFragments = (infos: GraphQLResolveInfo[], spreadName: string) => {
  const fragments = infos.map((info, index) => createFragment(info, index))

  const fragmentNames = fragments.map((fragment) => fragment.name.value)

  const combinedFragment = createCombinedFragment(spreadName, fragmentNames, infos[0]!.returnType)

  return [combinedFragment, ...fragments]
}

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
