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
        // @ts-expect-error - mocked method
        ctx._apis.localSettingsApi.getPreferences = jest.fn().mockResolvedValue({
          notifyWhenRunCompletes: false,
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).toEqual([])
      })

      it('should fix true value', async () => {
        // @ts-expect-error - mocked method
        ctx._apis.localSettingsApi.getPreferences = jest.fn().mockResolvedValue({
          notifyWhenRunCompletes: true,
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).toEqual([...NotifyCompletionStatuses])
      })

      it('should leave value alone if value is an array', async () => {
        // @ts-expect-error - mocked method
        ctx._apis.localSettingsApi.getPreferences = jest.fn().mockResolvedValue({
          notifyWhenRunCompletes: ['errored'],
        })

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).toEqual(['errored'])
      })

      it('should pass through default value if not set ', async () => {
        // @ts-expect-error - mocked method
        ctx._apis.localSettingsApi.getPreferences = jest.fn().mockResolvedValue({})

        await actions.refreshLocalSettings()

        expect(ctx.coreData.localSettings.preferences.notifyWhenRunCompletes).toEqual(['failed'])
      })
    })
  })
})
