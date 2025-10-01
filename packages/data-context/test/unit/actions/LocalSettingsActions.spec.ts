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
