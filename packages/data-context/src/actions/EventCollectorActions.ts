import type { DataContext } from '..'
import Debug from 'debug'

const pkg = require('@packages/root')

const debug = Debug('cypress:data-context:actions:EventCollectorActions')

interface CollectableEvent {
  campaign: string
  messageId: string
  medium: string
  cohort?: string
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

  async recordEvent (event: CollectableEvent): Promise<boolean> {
    try {
      const cloudUrl = this.ctx.cloud.getCloudUrl(cloudEnv)

      await this.ctx.util.fetch(
        `${cloudUrl}/anon-collect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': pkg.version,
          },
          body: JSON.stringify(event),
        },
      )

      debug(`Recorded event: %o`, event)

      return true
    } catch (err) {
      debug(`Failed to record event %o due to error %o`, event, err)

      return false
    }
  }
}
