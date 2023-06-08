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

    switch (newRun.status) {
      case 'RUNNING':
        // If the new run has the same run number and last time we saw the run it had 0 failures and now it has more than 0
        // failures, then it just started failing.
        if ((cachedRun.runNumber === newRun.runNumber) && (cachedRun.totalFailed === 0 && newRun.totalFailed > 0)) {
          this.sendRunFailingNotification(newRun.runNumber)
        } else {
          this.sendRunStartedNotification(newRun.runNumber)
        }

        break
      default:
        if (newRun.status) {
          this.sendRunCompletedNotification(newRun.runNumber, newRun.status.toLowerCase() as NotifyWhenRunCompletes)
        }
    }
  }

  sendRunStartedNotification (runNumber: number): void {
    if (this.notifyWhenRunStartsPreference !== true) {
      debug('notifyWhenRunStarts not true, skipping notification for run #%s', runNumber)

      return
    }

    this.ctx.actions.electron.showSystemNotification(this.projectTitle, `Run #${runNumber} started`, () => this.onNotificationClick(runNumber))
  }

  sendRunFailingNotification (runNumber: number): void {
    if (this.notifyWhenRunStartsFailingPreference !== true) {
      debug('notifyWhenRunStartsFailing not true, skipping notification for run #%s', runNumber)

      return
    }

    this.ctx.actions.electron.showSystemNotification(this.projectTitle, `Run #${runNumber} has started failing`, () => this.onNotificationClick(runNumber))
  }

  sendRunCompletedNotification (runNumber: number, status: NotifyWhenRunCompletes): void {
    if (!this.notifyWhenRunCompletesPreference?.includes(status)) {
      debug('notifyWhenRunCompletesPreference %s does not include %s, skipping notification for run #%s', this.notifyWhenRunCompletesPreference, status, runNumber)

      return
    }

    this.ctx.actions.electron.showSystemNotification(this.projectTitle, `Run #${runNumber} ${status}`, () => this.onNotificationClick(runNumber))
  }
}
