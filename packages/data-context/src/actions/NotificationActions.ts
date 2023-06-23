import type { NotifyWhenRunCompletes } from '@packages/types/src/preferences'
import type { DataContext } from '..'
import debugLib from 'debug'
import assert from 'assert'
import type { RelevantRunInfo } from '../gen/graphcache-config.gen'

const debug = debugLib('cypress:data-context:NotificationActions')

export class NotificationActions {
  constructor (private ctx: DataContext) { }

  async onNotificationClick (run: RelevantRunInfo) {
    debug('notification clicked for #%s', run.runNumber)

    await this.ctx.actions.browser.focusActiveBrowserWindow()

    await this.ctx.actions.project.debugCloudRun(run.runNumber)
  }

  private get projectTitle () {
    assert(this.ctx.coreData.currentProject, 'current project needs to be set to send notifications')

    return this.ctx.project.projectTitle(this.ctx.coreData.currentProject)
  }

  private get desktopNotificationsEnabledPreference () {
    return this.ctx.coreData.localSettings.preferences.desktopNotificationsEnabled
  }

  private get notifyWhenRunStartsPreference () {
    return this.ctx.coreData.localSettings.preferences.notifyWhenRunStarts
  }

  private get notifyWhenRunStartsFailingPreference () {
    return this.ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing
  }

  private get notifyWhenRunCompletesPreference () {
    return this.ctx.coreData.localSettings.preferences.notifyWhenRunCompletes
  }

  maybeSendRunNotification (cachedRun: RelevantRunInfo, newRun: RelevantRunInfo) {
    if (this.desktopNotificationsEnabledPreference !== true) {
      debug('desktopNotificationsEnabled not true, skipping notification for run #%s', newRun.runNumber)

      return
    }

    if (!newRun.status) {
      return
    }

    if (newRun.status === 'RUNNING') {
      // If the new run has the same run number and last time we saw the run it had 0 failures and now it has more than 0
      // failures, then it just started failing.
      if ((cachedRun.runNumber === newRun.runNumber) && (cachedRun.totalFailed === 0 && newRun.totalFailed > 0)) {
        this.sendRunFailingNotification(newRun)
      } else {
        this.sendRunStartedNotification(newRun)
      }
    }

    // If it has a status that isn't RUNNING, it must be done, whether it completed with failure, via cancelation, or other.
    this.sendRunCompletedNotification(newRun, newRun.status.toLowerCase() as NotifyWhenRunCompletes)
  }

  async #showRunNotification (body: string, run: RelevantRunInfo) {
    try {
      const cloudProjectMetadata = this.ctx.coreData.cloudProject.metadata ?? await this.ctx.actions.cloudProject.fetchMetadata()

      assert(cloudProjectMetadata?.name, 'cloudProject.name cannot be undefined')

      this.ctx.actions.electron.showSystemNotification(cloudProjectMetadata.name, body, () => this.onNotificationClick(run))
    } catch (e) {
      debug('error showing notification for run %i: %s', run.runNumber, e.message)
    }
  }

  sendRunStartedNotification (run: RelevantRunInfo) {
    if (this.notifyWhenRunStartsPreference !== true) {
      debug('notifyWhenRunStarts not true, skipping notification for run #%s', run)

      return
    }

    return this.#showRunNotification(`Run #${run.runNumber} started`, run)
  }

  sendRunFailingNotification (run: RelevantRunInfo) {
    if (this.notifyWhenRunStartsFailingPreference !== true) {
      debug('notifyWhenRunStartsFailing not true, skipping notification for run #%s', run)

      return
    }

    return this.#showRunNotification(`Run #${run.runNumber} has started failing`, run)
  }

  sendRunCompletedNotification (run: RelevantRunInfo, status: NotifyWhenRunCompletes) {
    if (!this.notifyWhenRunCompletesPreference?.includes(status)) {
      debug('notifyWhenRunCompletesPreference %s does not include %s, skipping notification for run #%s', this.notifyWhenRunCompletesPreference, status, run.runNumber)

      return
    }

    return this.#showRunNotification(`Run #${run.runNumber} ${status}`, run)
  }
}
