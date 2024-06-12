import { expect } from 'chai'
import sinon from 'sinon'
import type { DataContext } from '../../../src'
import { NotificationActions } from '../../../src/actions/NotificationActions'
import { CloudRunStatus, RelevantRunInfo } from '../../../src/gen/graphcache-config.gen'
import { createTestDataContext, createRelevantRun } from '../helper'

describe('NotificationActions', () => {
  let ctx: DataContext
  let actions: NotificationActions
  let showSystemNotificationStub

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    actions = new NotificationActions(ctx)

    ctx.coreData.currentProject = '/cy-project'

    showSystemNotificationStub = sinon.stub(ctx.actions.electron, 'showSystemNotification')
    sinon.stub(ctx.actions.cloudProject, 'fetchMetadata').resolves({
      id: 'project-local-id',
      name: 'cy-project',
    })
  })

  context('onNotificationClick', () => {
    it('focuses the active browser window and calls debugCloudRun', async () => {
      const run = createRelevantRun(12)

      const focusActiveBrowserWindowSpy = sinon.spy(ctx.actions.browser, 'focusActiveBrowserWindow')

      const debugCloudRunSpy = sinon.spy(ctx.actions.project, 'debugCloudRun')

      await actions.onNotificationClick(run)

      expect(focusActiveBrowserWindowSpy).to.have.been.called
      expect(debugCloudRunSpy).to.have.been.calledWith(run.runNumber)
    })
  })

  context('sendRunStartedNotification', () => {
    it('does not send notification if preference is not enabled', async () => {
      ctx.coreData.localSettings.preferences.notifyWhenRunStarts = false

      await actions.sendRunStartedNotification(101)

      expect(showSystemNotificationStub).not.to.have.been.called
    })

    it('sends notification if preference is enabled', async () => {
      const run = createRelevantRun(101)

      ctx.coreData.localSettings.preferences.notifyWhenRunStarts = true

      await actions.sendRunStartedNotification(run)

      expect(showSystemNotificationStub).to.have.been.calledWithMatch('cy-project', `Run #${run.runNumber} started`)
    })
  })

  context('sendRunFailingNotification', () => {
    it('does not send notification if preference is not enabled', () => {
      const run = createRelevantRun(101)

      ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing = false

      actions.sendRunFailingNotification(run)

      expect(showSystemNotificationStub).not.to.have.been.called
    })

    it('sends notification if preference is enabled', async () => {
      const run = createRelevantRun(101)

      ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing = true

      await actions.sendRunFailingNotification(run)

      expect(showSystemNotificationStub).to.have.been.calledWithMatch('cy-project', `Run #${run.runNumber} has started failing`)
    })
  })

  context('sendRunCompletedNotification', () => {
    it('does not send notification if status is not included in preference', () => {
      ctx.coreData.localSettings.preferences.notifyWhenRunCompletes = ['cancelled', 'errored', 'failed']

      actions.sendRunCompletedNotification(101, 'passed')

      expect(showSystemNotificationStub).not.to.have.been.called
    })

    it('sends notification if preference is enabled', async () => {
      const run = createRelevantRun(101)

      ctx.coreData.localSettings.preferences.notifyWhenRunCompletes = ['cancelled', 'errored', 'failed']

      await actions.sendRunCompletedNotification(run, 'failed')

      expect(showSystemNotificationStub).to.have.been.calledWithMatch('cy-project', `Run #${run.runNumber} failed`)
    })
  })

  context('maybeSendRunNotification', () => {
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

      expect(showSystemNotificationStub).not.to.have.been.called
    })

    it('sends run started notification if there is a new run with RUNNING status that is different from the previously cached run', () => {
      const sendRunStartedNotificationStub = sinon.stub(actions, 'sendRunStartedNotification')

      ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true
      const run1 = { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 } as const
      const run2 = { ...createRelevantRun(142), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 } as const

      actions.maybeSendRunNotification(
        run1, run2,
      )

      expect(sendRunStartedNotificationStub).to.have.been.calledWith(run2)
    })

    it('sends run started failing notification if status is RUNNING and totalFailed was 0 but is now greater than 0', () => {
      const sendRunFailingNotificationStub = sinon.stub(actions, 'sendRunFailingNotification')
      const run1 = { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0 } as const
      const run2 = { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 3 } as const

      ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true

      actions.maybeSendRunNotification(run1, run2)

      expect(sendRunFailingNotificationStub).to.have.been.calledWith(run2)
    })

    context('run completed', () => {
      ['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'].forEach((status) => {
        it(`sends run completed notification if new run has completed - ${status}`, () => {
          const run1: RelevantRunInfo = { ...createRelevantRun(141), status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0, branch: 'branch123', organizationId: '1' }
          const run2: RelevantRunInfo = { ...createRelevantRun(142), status: status as CloudRunStatus, sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0, branch: 'branch123', organizationId: '1' }
          const sendRunCompletedNotificationStub = sinon.stub(actions, 'sendRunCompletedNotification')

          ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true

          actions.maybeSendRunNotification(run1, run2)

          expect(sendRunCompletedNotificationStub).to.have.been.calledWith(run2, status.toLocaleLowerCase())
        })
      })
    })
  })
})
