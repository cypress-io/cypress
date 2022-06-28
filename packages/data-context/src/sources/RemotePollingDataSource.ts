import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'

import type { DataContext } from '../DataContext'
import type { Query } from '../gen/graphcache-config.gen'

const debug = debugLib('cypress:data-context:sources:RemotePollingDataSource')

const LATEST_RUN_UPDATE_OPERATION_DOC = gql`
  query RemotePollingDataSource_latestRunUpdateSpecData(
    $commitBranch: String!
    $projectSlug: String!
    # sinceDateTime: DateTime
  ) {
    cloudLatestRunUpdateSpecData(commitBranch: $commitBranch, projectSlug: $projectSlug) {
      mostRecentUpdate
      pollingInterval
    }
  }
`
const LATEST_RUN_UPDATE_OPERATION = print(LATEST_RUN_UPDATE_OPERATION_DOC)

export class RemotePollingDataSource {
  #subscribedCount = 0
  #specPolling?: NodeJS.Timeout
  constructor (private ctx: DataContext) {}

  #startPollingForSpecs (branch: string, projectSlug: string) {
    // when the page refreshes, a previously started subscription may be running
    // this will reset it and start a new one
    if (this.#specPolling) {
      clearTimeout(this.#specPolling)
    }

    debug(`Sending initial request for startPollingForSpecs`)

    // Send the spec polling request
    this.#sendSpecPollingRequest(branch, projectSlug).catch((e) => {
      debug(`Error executing specPollingRequest %o`, e)
    })
  }

  #stopPolling () {
    if (this.#specPolling) {
      clearTimeout(this.#specPolling)
      this.#specPolling = undefined
    }
  }

  async #sendSpecPollingRequest (commitBranch: string, projectSlug: string) {
    const result = await this.ctx.cloud.executeRemoteGraphQL<Pick<Query, 'cloudLatestRunUpdateSpecData'>>({
      fieldName: 'cloudLatestRunUpdateSpecData',
      operationDoc: LATEST_RUN_UPDATE_OPERATION_DOC,
      operation: LATEST_RUN_UPDATE_OPERATION,
      operationVariables: {
        commitBranch,
        projectSlug,
      },
      requestPolicy: 'network-only', // we never want to hit local cache for this request
    })

    debug(`%s Response for startPollingForSpecs %o`, new Date().toISOString(), result)

    const secondsToPollNext = (result.data?.cloudLatestRunUpdateSpecData?.pollingInterval ?? 30)
    const mostRecentUpdate = result.data?.cloudLatestRunUpdateSpecData?.mostRecentUpdate ?? null

    this.ctx.emitter.specPollingUpdate(mostRecentUpdate)

    this.#specPolling = setTimeout(async () => {
      await this.#sendSpecPollingRequest(commitBranch, projectSlug)
    }, secondsToPollNext * 1000)

    return result
  }

  subscribeAndPoll (branch?: string | null, projectSlug?: string | null) {
    if (!branch || !projectSlug) {
      return this.ctx.emitter.subscribeTo('noopChange', { sendInitial: false })
    }

    debug('Subscribing, subscribed count %d', this.#subscribedCount)
    if (this.#subscribedCount === 0) {
      debug('Starting polling')
      this.#startPollingForSpecs(branch, projectSlug)
    }

    this.#subscribedCount++

    return this.ctx.emitter.subscribeTo('specPollingUpdate', {
      sendInitial: false,
      onUnsubscribe: () => {
        debug('Unsubscribing, subscribed count %d', this.#subscribedCount)
        this.#subscribedCount--
        if (this.#subscribedCount === 0) {
          this.#stopPolling()
        }
      },
    })
  }
}
