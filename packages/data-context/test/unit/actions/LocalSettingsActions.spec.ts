import { expect } from 'chai'
import sinon from 'sinon'
import { LocalSettingsActions } from '../../../src/actions/LocalSettingsActions'
import { createTestDataContext } from '../helper'
import type { DataContext } from '../../../src'
import { NotifyCompletionStatuses } from '@packages/types'

describe('LocalSettingsActions', () => {
  let ctx: DataContext
  let actions: LocalSettingsActions

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    actions = new LocalSettingsActions(ctx)
  })

  context('refreshLocalSettings', () => {
    context('notifyWhenRunCompletes', () => {
      it('should fix false value', async () => {
        ctx._apis.localSettingsApi.getPreferences = sinon.stub().resolves({
        //@ts-ignore
          notifyWhenRunCompletes: false,
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).to.eql([])
      })

      it('should fix true value', async () => {
        ctx._apis.localSettingsApi.getPreferences = sinon.stub().resolves({
        //@ts-ignore
          notifyWhenRunCompletes: true,
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).to.eql([...NotifyCompletionStatuses])
      })

      it('should leave value alone if value is an array', async () => {
        ctx._apis.localSettingsApi.getPreferences = sinon.stub().resolves({
        //@ts-ignore
          notifyWhenRunCompletes: ['errored'],
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).to.eql(['errored'])
      })

      it('should pass through default value if not set ', async () => {
        ctx._apis.localSettingsApi.getPreferences = sinon.stub().resolves({})

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).to.eql(['failed'])
      })
    })
  })
})
