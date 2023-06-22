import { expect } from 'chai'
import sinon from 'sinon'
import type { DataContext } from '../../../src'
import { NotificationActions } from '../../../src/actions/NotificationActions'
import { CloudRunStatus } from '../../../src/gen/graphcache-config.gen'
import { createTestDataContext } from '../helper'

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
      const runNumber = 12

      const focusActiveBrowserWindowSpy = sinon.spy(ctx.actions.browser, 'focusActiveBrowserWindow')

      const debugCloudRunSpy = sinon.spy(ctx.actions.project, 'debugCloudRun')

      await actions.onNotificationClick(runNumber)

      expect(focusActiveBrowserWindowSpy).to.have.been.called
      expect(debugCloudRunSpy).to.have.been.calledWith(runNumber)
    })
  })

  context('sendRunStartedNotification', () => {
    it('does not send notification if preference is not enabled', async () => {
      ctx.coreData.localSettings.preferences.notifyWhenRunStarts = false

      await actions.sendRunStartedNotification(101)

      expect(showSystemNotificationStub).not.to.have.been.called
    })

    it('sends notification if preference is enabled', async () => {
      const runNumber = 101

      ctx.coreData.localSettings.preferences.notifyWhenRunStarts = true

      await actions.sendRunStartedNotification(runNumber)

      expect(showSystemNotificationStub).to.have.been.calledWithMatch('cy-project', `Run #${runNumber} started`)
    })
  })

  context('sendRunFailingNotification', () => {
    it('does not send notification if preference is not enabled', () => {
      ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing = false

      actions.sendRunFailingNotification(101)

      expect(showSystemNotificationStub).not.to.have.been.called
    })

    it('sends notification if preference is enabled', async () => {
      const runNumber = 101

      ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing = true

      await actions.sendRunFailingNotification(runNumber)

      expect(showSystemNotificationStub).to.have.been.calledWithMatch('cy-project', `Run #${runNumber} has started failing`)
    })
  })

  context('sendRunCompletedNotification', () => {
    it('does not send notification if status is not included in preference', () => {
      ctx.coreData.localSettings.preferences.notifyWhenRunCompletes = ['cancelled', 'errored', 'failed']

      actions.sendRunCompletedNotification(101, 'passed')

      expect(showSystemNotificationStub).not.to.have.been.called
    })

    it('sends notification if preference is enabled', async () => {
      const runNumber = 101

      ctx.coreData.localSettings.preferences.notifyWhenRunCompletes = ['cancelled', 'errored', 'failed']

      await actions.sendRunCompletedNotification(runNumber, 'failed')

      expect(showSystemNotificationStub).to.have.been.calledWithMatch('cy-project', `Run #${runNumber} failed`)
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
        { runNumber: 141, status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 },
        { runNumber: 141, status: 'PASSED', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 },
      )

      expect(showSystemNotificationStub).not.to.have.been.called
    })

    it('sends run started notification if there is a new run with RUNNING status that is different from the previously cached run', () => {
      const sendRunStartedNotificationStub = sinon.stub(actions, 'sendRunStartedNotification')

      ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true

      actions.maybeSendRunNotification(
        { runNumber: 141, status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 },
        { runNumber: 142, status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 1 },
      )

      expect(sendRunStartedNotificationStub).to.have.been.calledWith(142)
    })

    it('sends run started failing notification if status is RUNNING and totalFailed was 0 but is now greater than 0', () => {
      const sendRunFailingNotificationStub = sinon.stub(actions, 'sendRunFailingNotification')

      ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true

      actions.maybeSendRunNotification(
        { runNumber: 141, status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0 },
        { runNumber: 141, status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 3 },
      )

      expect(sendRunFailingNotificationStub).to.have.been.calledWith(141)
    })

    context('run completed', () => {
      ['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'].forEach((status) => {
        it(`sends run completed notification if new run has completed - ${status}`, () => {
          const sendRunCompletedNotificationStub = sinon.stub(actions, 'sendRunCompletedNotification')

          ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true

          actions.maybeSendRunNotification(
            { runNumber: 141, status: 'RUNNING', sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0 },
            { runNumber: 142, status: status as CloudRunStatus, sha: 'f909139209c8351cfaa737c7fd122ad4f17fdaa5', totalFailed: 0 },
          )

          expect(sendRunCompletedNotificationStub).to.have.been.calledWith(142, status.toLocaleLowerCase())
        })
      })
    })
  })
})
