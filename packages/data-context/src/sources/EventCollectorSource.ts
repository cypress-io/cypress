import Debug from 'debug'
import dayjs from 'dayjs'
import type { DataContext } from '..'
import type { CloudTestingTypeEnum, LocalTestCountsInput } from '@packages/graphql/src/gen/nxs.gen'
import { getTestCounts } from '../util/testCounts'
import { debounce } from 'lodash'

const debug = Debug('cypress:data-context:sources:EventCollectorSource')

export class EventCollectorSource {
  constructor (private ctx: DataContext) {
    debug('Starting')
    ctx.emitter.subscribeToRawEvent('authChange', this.#localTestCountsListener)
    ctx.emitter.subscribeToRawEvent('configChange', this.#localTestCountsListener)
  }

  #localTestCountsListener = debounce(() => {
    this.sendLocalTestCounts()
    .catch((error) => {
      debug('error caught from sending counts', error)
    })
  }, 250)

  destroy () {
    this.ctx.emitter.unsubscribeToRawEvent('authChange', this.#localTestCountsListener)
    this.ctx.emitter.unsubscribeToRawEvent('configChange', this.#localTestCountsListener)
  }

  async sendLocalTestCounts () {
    debug('Checking to send local test counts')
    if (!this.ctx.coreData.currentTestingType) {
      debug('will not send - no testing type')

      return
    }

    const user = this.ctx.coreData.user
    const isAuthenticated = !!user && !!user.name

    if (!isAuthenticated) {
      debug('will not send - not authenticated')

      return
    }

    const currentLocalPreferences = this.ctx.project.getCurrentProjectSavedState()
    const lastTestCountsEvent = currentLocalPreferences?.lastTestCountsEvent
    const thirtyDaysAgo = dayjs().subtract(30, 'days')
    const hasBeenSentLast30Days = !!lastTestCountsEvent && thirtyDaysAgo.isBefore(dayjs(lastTestCountsEvent))

    if (hasBeenSentLast30Days) {
      debug('will not send', { isAuthenticated, hasBeenSentLast30Days })

      return
    }

    const testingType: CloudTestingTypeEnum = this.ctx.coreData.currentTestingType === 'e2e' ? 'E2E' : 'COMPONENT'
    const testCounts = await getTestCounts(this.ctx.project.specs)
    const projectSlug = await this.ctx.project.projectId()

    const localTestCounts: LocalTestCountsInput = {
      projectSlug,
      testingType,
      ...testCounts,
      branch: this.ctx.git?.currentBranch,
    }

    debug('sending recordEvent for local test counts', localTestCounts)

    const result = await this.ctx.actions.eventCollector.recordEventGQL({ localTestCounts })

    if (result.data?.cloudRecordEvent === true) {
      await this.ctx.actions.localSettings.setPreferences(JSON.stringify({ lastTestCountsEvent: Date.now() }), 'project')
    }

    debug('result', result)
  }
}
