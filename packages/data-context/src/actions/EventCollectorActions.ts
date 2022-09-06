import type { DataContext } from '..'
import Debug from 'debug'

const debug = Debug('cypress:data-context:sources:EventCollectorDataSource')

interface CollectableEvent {
  campaign: string
  messageId: string
  medium: string
}

export class EventCollectorActions {
  constructor (private ctx: DataContext) {}

  async recordEvent (event: CollectableEvent): Promise<boolean> {
    try {
      // TODO: Stubbed with Staging for development
      const dashboardUrl = 'https://dashboard-staging.cypress.io' //this.ctx.cloud.getDashboardUrl()

      await this.ctx.util.fetch(
        `${dashboardUrl}/anon-collect`,
        { method: 'POST', body: JSON.stringify({ ...event }) },
      )

      debug(`Recorded event: %o`, event)

      return true
    } catch (err) {
      debug(`Failed to record event %o due to error %o`, event, err)

      return false
    }
  }
}
