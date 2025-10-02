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
  })
})
