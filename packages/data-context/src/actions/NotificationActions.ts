import type { NotifyWhenRunCompletes } from '@packages/types/src/preferences'
import type { DataContext } from '..'
import debugLib from 'debug'
import assert from 'assert'

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

  async sendRunStartedNotification (runNumber: number): Promise<void> {
    if (this.desktopNotificationsEnabledPreference !== true) {
      debug('desktopNotificationsEnabled not true, skipping notification for run #%s', runNumber)

      return
    }

    if (this.notifyWhenRunStartsPreference !== true) {
      debug('notifyWhenRunStarts not true, skipping notification for run #%s', runNumber)

      return
    }

    this.ctx.actions.electron.showSystemNotification(this.projectTitle, `Run #${runNumber} started`, () => this.onNotificationClick(runNumber))
  }

  async sendRunFailingNotification (runNumber: number): Promise<void> {
    if (this.desktopNotificationsEnabledPreference !== true) {
      debug('desktopNotificationsEnabled not true, skipping notification for run #%s', runNumber)

      return
    }

    if (this.notifyWhenRunStartsFailingPreference !== true) {
      debug('notifyWhenRunStartsFailing not true, skipping notification for run #%s', runNumber)

      return
    }

    this.ctx.actions.electron.showSystemNotification(this.projectTitle, `Run #${runNumber} has started failing`, () => this.onNotificationClick(runNumber))
  }

  async sendRunCompletedNotification (runNumber: number, status: NotifyWhenRunCompletes): Promise<void> {
    if (this.desktopNotificationsEnabledPreference !== true) {
      debug('desktopNotificationsEnabled not true, skipping notification for run #%s', runNumber)

      return
    }

    if (!this.notifyWhenRunCompletesPreference?.includes(status)) {
      debug('notifyWhenRunCompletesPreference %s does not include %s, skipping notification for run #%s', this.notifyWhenRunCompletesPreference, status, runNumber)

      return
    }

    this.ctx.actions.electron.showSystemNotification(this.projectTitle, `Run #${runNumber} ${status}`, () => this.onNotificationClick(runNumber))
  }
}
