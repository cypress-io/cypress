import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import { NotificationActions } from '../../../src/actions/NotificationActions'
import { CloudRunStatus, RelevantRunInfo } from '../../../src/gen/graphcache-config.gen'
import { createTestDataContext, createRelevantRun } from '../helper'

describe('NotificationActions', () => {
  let ctx: DataContext
  let actions: NotificationActions
  let showSystemNotificationStub

  beforeEach(() => {
    ctx = createTestDataContext('open')

    actions = new NotificationActions(ctx)

    ctx.coreData.currentProject = '/cy-project'

    showSystemNotificationStub = jest.spyOn(ctx.actions.electron, 'showSystemNotification')

    jest.spyOn(ctx.actions.cloudProject, 'fetchMetadata').mockResolvedValue({
      id: 'project-local-id',
      name: 'cy-project',
    })
  })

  describe('onNotificationClick', () => {
    it('focuses the active browser window and calls debugCloudRun', async () => {
      const run = createRelevantRun(12)

      const focusActiveBrowserWindowSpy = jest.spyOn(ctx.actions.browser, 'focusActiveBrowserWindow')

      const debugCloudRunSpy = jest.spyOn(ctx.actions.project, 'debugCloudRun')

      await actions.onNotificationClick(run)

      expect(focusActiveBrowserWindowSpy).toHaveBeenCalled()
      expect(debugCloudRunSpy).toHaveBeenCalledWith(run.runNumber)
    })
  })

  describe('sendRunStartedNotification', () => {
    it('does not send notification if preference is not enabled', async () => {
      ctx.coreData.localSettings.preferences.notifyWhenRunStarts = false

      // @ts-expect-error - number as arg
      await actions.sendRunStartedNotification(101)

      expect(showSystemNotificationStub).not.toHaveBeenCalled()
    })

    it('sends notification if preference is enabled', async () => {
      const run = createRelevantRun(101)

      ctx.coreData.localSettings.preferences.notifyWhenRunStarts = true

      await actions.sendRunStartedNotification(run)

      expect(showSystemNotificationStub).toHaveBeenCalledWith('cy-project', `Run #${run.runNumber} started`, expect.any(Function))
    })
  })

  describe('sendRunFailingNotification', () => {
    it('does not send notification if preference is not enabled', () => {
      const run = createRelevantRun(101)

      ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing = false

      actions.sendRunFailingNotification(run)

      expect(showSystemNotificationStub).not.toHaveBeenCalled()
    })

    it('sends notification if preference is enabled', async () => {
      const run = createRelevantRun(101)

      ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing = true

      await actions.sendRunFailingNotification(run)

      expect(showSystemNotificationStub).toHaveBeenCalledWith('cy-project', `Run #${run.runNumber} has started failing`, expect.any(Function))
    })
  })

  describe('sendRunCompletedNotification', () => {
    it('does not send notification if status is not included in preference', () => {
      ctx.coreData.localSettings.preferences.notifyWhenRunCompletes = ['cancelled', 'errored', 'failed']

      // @ts-expect-error - number as arg
      actions.sendRunCompletedNotification(101, 'passed')

      expect(showSystemNotificationStub).not.toHaveBeenCalled()
    })

    it('sends notification if preference is enabled', async () => {
      const run = createRelevantRun(101)

      ctx.coreData.localSettings.preferences.notifyWhenRunCompletes = ['cancelled', 'errored', 'failed']

      await actions.sendRunCompletedNotification(run, 'failed')

      expect(showSystemNotificationStub).toHaveBeenCalledWith('cy-project', `Run #${run.runNumber} failed`, expect.any(Function))
    })
  })

  describe('maybeSendRunNotification', () => {
    beforeEach(() => {
      // For these tests, enable all notification preferences to verify that desktopNotificationsEnabled works as expected
      ctx.coreData.localSettings.preferences.notifyWhenRunStarts = true
      ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing = true
      ctx.coreData.localSettings.preferences.notifyWhenRunCompletes = ['cancelled', 'errored', 'failed', 'passed']
    })

    it('does not send any notifications if preference is not enabled', () => {
      ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = false

      actions.maybeSendRunNotification(
        { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 },
        { ...createRelevantRun(141), status: 'PASSED', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 },
      )

      expect(showSystemNotificationStub).not.toHaveBeenCalled()
    })

    it('sends run started notification if there is a new run with RUNNING status that is different from the previously cached run', () => {
      const sendRunStartedNotificationStub = jest.spyOn(actions, 'sendRunStartedNotification')

      ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true
      const run1 = { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 } as const
      const run2 = { ...createRelevantRun(142), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 } as const

      actions.maybeSendRunNotification(
        run1, run2,
      )

      expect(sendRunStartedNotificationStub).toHaveBeenCalledWith(run2)
    })

    it('sends run started failing notification if status is RUNNING and totalFailed was 0 but is now greater than 0', () => {
      const sendRunFailingNotificationStub = jest.spyOn(actions, 'sendRunFailingNotification')
      const run1 = { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0 } as const
      const run2 = { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 3 } as const

      ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true

      actions.maybeSendRunNotification(run1, run2)

      expect(sendRunFailingNotificationStub).toHaveBeenCalledWith(run2)
    })

    describe('run completed', () => {
      ['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'].forEach((status) => {
        it(`sends run completed notification if new run has completed - ${status}`, () => {
          const run1: RelevantRunInfo = { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0, branch: 'branch123', organizationId: '1' }
          const run2: RelevantRunInfo = { ...createRelevantRun(142), status: status as CloudRunStatus, sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0, branch: 'branch123', organizationId: '1' }
          const sendRunCompletedNotificationStub = jest.spyOn(actions, 'sendRunCompletedNotification')

          ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true

          actions.maybeSendRunNotification(run1, run2)

          // @ts-expect-error
          expect(sendRunCompletedNotificationStub).toHaveBeenCalledWith(run2, status.toLocaleLowerCase())
        })
      })
    })
  })
})
