import { gql } from '@urql/core'
import type { DataContext } from '..'
import Debug from 'debug'
import type { LocalTestCountsInput } from '@packages/graphql/src/gen/nxs.gen'

const pkg = require('@packages/root')

const debug = Debug('cypress:data-context:actions:EventCollectorActions')

interface CollectibleEvent {
  campaign: string
  messageId: string
  medium: string
  cohort?: string
  payload?: object
  machineId?: string
}

type EventInputs = {
  localTestCounts?: LocalTestCountsInput
}

/**
 * Defaults to staging when doing development. To override to production for development,
 * explicitly set process.env.CYPRESS_INTERNAL_ENV to 'production`
 */
const cloudEnv = (process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV || 'production') as 'development' | 'staging' | 'production'

export class EventCollectorActions {
  constructor (private ctx: DataContext) {
    debug('Using %s environment for Event Collection', cloudEnv)
  }

  async recordEvent (event: CollectibleEvent, includeMachineId: boolean): Promise<boolean> {
    try {
      const cloudUrl = this.ctx.cloud.getCloudUrl(cloudEnv)
      const eventUrl = includeMachineId ? `${cloudUrl}/machine-collect` : `${cloudUrl}/anon-collect`
      const headers = {
        'Content-Type': 'application/json',
        'x-cypress-version': pkg.version,
      }

      if (includeMachineId) {
        event.machineId = (await this.ctx.coreData.machineId) || undefined
      }

      await this.ctx.util.fetch(
        eventUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(event),
        },
      )

      debug(`Recorded %s event: %o`, includeMachineId ? 'machine-linked' : 'anonymous', event)

      return true
    } catch (err) {
      debug(`Failed to record event %o due to error %o`, event, err)

      return false
    }
  }

  recordEventGQL (eventInputs: EventInputs) {
    const RECORD_EVENT_GQL = gql`
      mutation EventCollectorActions_RecordEvent($localTestCounts: LocalTestCountsInput) {
        cloudRecordEvent(localTestCounts: $localTestCounts)
      }
    `

    debug('recordEventGQL final variables %o', eventInputs)

    return this.ctx.cloud.executeRemoteGraphQL({
      operationType: 'mutation',
      fieldName: 'cloudRecordEvent',
      operationDoc: RECORD_EVENT_GQL,
      operationVariables: eventInputs,
    })
  }
}
