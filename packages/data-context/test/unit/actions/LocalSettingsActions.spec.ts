import { describe, expect, it, jest } from '@jest/globals'
import { LocalSettingsActions } from '../../../src/actions/LocalSettingsActions'
import { createTestDataContext } from '../helper'
import type { DataContext } from '../../../src'
import { NotifyCompletionStatuses } from '@packages/types'

describe('LocalSettingsActions', () => {
  let ctx: DataContext
  let actions: LocalSettingsActions

  beforeEach(() => {
    ctx = createTestDataContext('open')

    actions = new LocalSettingsActions(ctx)
  })

  describe('getLaunchableEditor', () => {
    beforeEach(() => {
      ctx.coreData.localSettings.availableEditors = [
        { id: 'computer', name: 'Finder', binary: 'computer' },
        { id: 'code', name: 'Visual Studio Code', binary: 'code' },
      ]
    })

    it('returns the preferred editor when Cypress detected it', async () => {
      ctx.coreData.localSettings.preferences.preferredEditorBinary = 'code'

      expect(await actions.getLaunchableEditor()).toEqual('code')
    })

    it('returns undefined for an editor Cypress did not detect', async () => {
      ctx.coreData.localSettings.preferences.preferredEditorBinary = '/bin/sh'

      expect(await actions.getLaunchableEditor()).toBeUndefined()
    })

    it('returns undefined when no editor is saved', async () => {
      expect(await actions.getLaunchableEditor()).toBeUndefined()
    })

    it('waits for detection to finish', async () => {
      ctx.coreData.localSettings.availableEditors = []
      ctx.coreData.localSettings.preferences.preferredEditorBinary = 'code'
      ctx.coreData.localSettings.refreshing = Promise.resolve().then(() => {
        ctx.coreData.localSettings.availableEditors = [{ id: 'code', name: 'Visual Studio Code', binary: 'code' }]

        return ctx.coreData.localSettings.availableEditors
      })

      expect(await actions.getLaunchableEditor()).toEqual('code')
    })
  })

  describe('refreshLocalSettings', () => {
    describe('notifyWhenRunCompletes', () => {
      it('should fix false value', async () => {
        jest.spyOn(ctx._apis.localSettingsApi, 'getPreferences').mockResolvedValue({
          // @ts-expect-error - incorrect return type
          notifyWhenRunCompletes: false,
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).toEqual([])
      })

      it('should fix true value', async () => {
        jest.spyOn(ctx._apis.localSettingsApi, 'getPreferences').mockResolvedValue({
          // @ts-expect-error - incorrect return type
          notifyWhenRunCompletes: true,
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).toEqual([...NotifyCompletionStatuses])
      })

      it('should leave value alone if value is an array', async () => {
        jest.spyOn(ctx._apis.localSettingsApi, 'getPreferences').mockResolvedValue({
          notifyWhenRunCompletes: ['errored'],
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).toEqual(['errored'])
      })

      it('should pass through default value if not set ', async () => {
        jest.spyOn(ctx._apis.localSettingsApi, 'getPreferences').mockResolvedValue({})

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).toEqual(['failed'])
      })
    })
  })
})
