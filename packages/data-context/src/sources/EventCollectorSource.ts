import Debug from 'debug'
import type { DataContext } from '..'
import type { CloudTestingTypeEnum, LocalTestCountsInput } from '@packages/graphql/src/gen/nxs.gen'
import getTestCounts from '../util/testCounts'

const debug = Debug('cypress:data-context:sources:EventCollectorSource')

export class EventCollectorSource {
  constructor (private ctx: DataContext) {
    debug('Starting')
    ctx.emitter.subscribeToRawEvent('authChange', this.localTestCountsListener)
    ctx.emitter.subscribeToRawEvent('specsChange', this.localTestCountsListener)
  }

  get localTestCountsListener () {
    return () => {
      this.sendLocalTestCounts()
    }
  }

  destroy () {
    this.ctx.emitter.unsubscribeToRawEvent('authChange', this.localTestCountsListener)
    this.ctx.emitter.unsubscribeToRawEvent('specsChange', this.localTestCountsListener)
  }

  async sendLocalTestCounts () {
    debug('Checking to send local test counts')
    const user = this.ctx.coreData.user
    const isAuthenticated = !!user && !!user.name
    const projectSlug = await this.ctx.project.projectId()
    let testingType: CloudTestingTypeEnum | undefined

    switch (this.ctx.coreData.currentTestingType) {
      case 'component':
        testingType = 'COMPONENT'
        break
      case 'e2e':
        testingType = 'E2E'
        break
      default:
    }

    if (!projectSlug || !testingType || !isAuthenticated) {
      return
    }

    const testCounts = await getTestCounts(this.ctx.project.specs)

    const localTestCounts: LocalTestCountsInput = {
      projectSlug,
      testingType,
      ...testCounts,
    }

    debug('sending recordEvent for local test counts', localTestCounts)

    const result = await this.ctx.actions.eventCollector.recordEventGQL({ localTestCounts })

    debug('result', result)
  }
}
