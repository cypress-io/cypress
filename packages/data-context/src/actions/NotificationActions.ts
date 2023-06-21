import type { NotifyWhenRunCompletes } from '@packages/types/src/preferences'
import type { DataContext } from '..'
import debugLib from 'debug'
import assert from 'assert'
import type { RelevantRunInfo } from '../gen/graphcache-config.gen'

const debug = debugLib('cypress:data-context:NotificationActions')

export class NotificationActions {
  constructor (private ctx: DataContext) { }

  async onNotificationClick (runNumber: number) {
    debug('notification clicked for #%s', runNumber)
    await this.ctx.actions.browser.focusActiveBrowserWindow()

    await this.ctx.actions.project.debugCloudRun(runNumber)
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
        this.sendRunFailingNotification(newRun.runNumber)
      } else {
        this.sendRunStartedNotification(newRun.runNumber)
      }
    }

    // If it has a status that isn't RUNNING, it must be done, whether it completed with failure, via cancelation, or other.
    this.sendRunCompletedNotification(newRun.runNumber, newRun.status.toLowerCase() as NotifyWhenRunCompletes)
  }

  private async showRunNotification (body: string, runNumber: number) {
    try {
      const cloudProjectInfo = await this.ctx.actions.project.fetchCloudProjectInfo()

      assert(cloudProjectInfo?.name, 'cloudProject.name cannot be undefined')

      this.ctx.actions.electron.showSystemNotification(cloudProjectInfo?.name ?? this.projectTitle, body, () => this.onNotificationClick(runNumber))
    } catch (e) {
      debug('error showing notification for run %i: %s', runNumber, e.message)
    }
  }

  sendRunStartedNotification (runNumber: number) {
    if (this.notifyWhenRunStartsPreference !== true) {
      debug('notifyWhenRunStarts not true, skipping notification for run #%s', runNumber)

      return
    }

    return this.showRunNotification(`Run #${runNumber} started`, runNumber)
  }

  sendRunFailingNotification (runNumber: number) {
    if (this.notifyWhenRunStartsFailingPreference !== true) {
      debug('notifyWhenRunStartsFailing not true, skipping notification for run #%s', runNumber)

      return
    }

    return this.showRunNotification(`Run #${runNumber} has started failing`, runNumber)
  }

  sendRunCompletedNotification (runNumber: number, status: NotifyWhenRunCompletes) {
    if (!this.notifyWhenRunCompletesPreference?.includes(status)) {
      debug('notifyWhenRunCompletesPreference %s does not include %s, skipping notification for run #%s', this.notifyWhenRunCompletesPreference, status, runNumber)

      return
    }

    return this.showRunNotification(`Run #${runNumber} ${status}`, runNumber)
  }
}
