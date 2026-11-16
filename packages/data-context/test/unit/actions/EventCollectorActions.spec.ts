import { describe, expect, it, beforeEach, jest } from '@jest/globals'

import type { DataContext } from '../../../src'
import { EventCollectorActions } from '../../../src/actions/EventCollectorActions'
import { createTestDataContext } from '../helper'
import pkg from '@packages/root'

describe('EventCollectorActions', () => {
  let ctx: DataContext
  let actions: EventCollectorActions

  beforeEach(() => {
    ctx = createTestDataContext('open')

    jest.spyOn(ctx.util, 'fetch').mockResolvedValue({} as any)

    actions = new EventCollectorActions(ctx)
  })

  describe('.recordEvent', () => {
    it('makes expected request for anonymous event', async () => {
      await actions.recordEvent({
        campaign: 'abc',
        medium: 'def',
        messageId: 'ghi',
        cohort: '123',
      }, false)

      expect(ctx.util.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/anon-collect$/), // Verify URL ends with expected 'anon-collect' path
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cypress-version': pkg.version }, body: '{"campaign":"abc","medium":"def","messageId":"ghi","cohort":"123"}' },
      )
    })

    it('makes expected request for machine-linked event', async () => {
      ctx.coreData.machineId = Promise.resolve('xyz')

      await actions.recordEvent({
        campaign: 'abc',
        medium: 'def',
        messageId: 'ghi',
        cohort: '123',
      }, true)

      expect(ctx.util.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/machine-collect$/), // Verify URL ends with expected 'machine-collect' path
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cypress-version': pkg.version }, body: '{"campaign":"abc","medium":"def","messageId":"ghi","cohort":"123","machineId":"xyz"}' },
      )
    })

    it('resolve true if request succeeds', async () => {
      jest.spyOn(ctx.util, 'fetch').mockResolvedValue({} as any)

      const result = await actions.recordEvent({ campaign: '', medium: '', messageId: '', cohort: '' }, false)

      expect(result).toBe(true)
    })

    it('resolves false if request fails', async () => {
      jest.spyOn(ctx.util, 'fetch').mockRejectedValue({} as any)

      const result = await actions.recordEvent({ campaign: '', medium: '', messageId: '', cohort: '' }, false)

      expect(result).toBe(false)
    })

    it('records nothing when guest telemetry is disabled', async () => {
      process.env.CYPRESS_DISABLE_GUEST_TELEMETRY = '1'

      try {
        const result = await actions.recordEvent({ campaign: '', medium: '', messageId: '', cohort: '' }, false)

        expect(result).toBe(false)
        expect(ctx.util.fetch).not.toHaveBeenCalled()
      } finally {
        delete process.env.CYPRESS_DISABLE_GUEST_TELEMETRY
      }
    })

    it('resolves the environment when the event is recorded, not when the module loads', async () => {
      const original = process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV

      process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'staging'

      try {
        await actions.recordEvent({ campaign: '', medium: '', messageId: '', cohort: '' }, false)
      } finally {
        if (original === undefined) {
          delete process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV
        } else {
          process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = original
        }
      }

      expect(ctx.util.fetch).toHaveBeenNthCalledWith(1, 'https://cloud-staging.cypress.io/anon-collect', expect.anything())
    })
  })
})
