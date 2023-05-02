import type { DataContext } from '..'
import Debug from 'debug'
import type { EventIdFieldEnum } from '../gen/graphcache-config.gen'

const pkg = require('@packages/root')

const debug = Debug('cypress:data-context:actions:EventCollectorActions')

interface CollectibleEvent {
  campaign: string
  messageId: string
  medium: string
  cohort?: string
  payload?: object
}

interface IdentifiableCollectibleEvent extends CollectibleEvent{
  machineId: string | undefined
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

  async recordEvent (event: CollectibleEvent, identifiers: EventIdFieldEnum[]): Promise<boolean> {
    try {
      const isAnonEvent = !identifiers || identifiers.length === 0
      const cloudUrl = this.ctx.cloud.getCloudUrl(cloudEnv)
      const eventUrl = isAnonEvent ? `${cloudUrl}/anon-collect` : `${cloudUrl}/event-collect`
      const headers = {
        'Content-Type': 'application/json',
        'x-cypress-version': pkg.version,
      }

      if (identifiers.includes('machine_id')) {
        (event as IdentifiableCollectibleEvent).machineId = (await this.ctx.coreData.machineId) || undefined
      }

      await this.ctx.util.fetch(
        eventUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(event),
        },
      )

      debug(`Recorded %s event: %o`, isAnonEvent ? 'anonymous' : 'identifiable', event)

      return true
    } catch (err) {
      debug(`Failed to record event %o due to error %o`, event, err)

      return false
    }
  }
}
