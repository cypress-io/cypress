import type { DataContext } from '../../../src'
import { EventCollectorActions } from '../../../src/actions/EventCollectorActions'
import { createTestDataContext } from '../helper'
import sinon, { SinonStub } from 'sinon'
import sinonChai from 'sinon-chai'
import chai, { expect } from 'chai'

const pkg = require('@packages/root')

chai.use(sinonChai)

describe('EventCollectorActions', () => {
  let ctx: DataContext
  let actions: EventCollectorActions

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    sinon.stub(ctx.util, 'fetch').resolves({} as any)

    actions = new EventCollectorActions(ctx)
  })

  context('.recordEvent', () => {
    it('makes expected request', async () => {
      await actions.recordEvent({
        campaign: 'abc',
        medium: 'def',
        messageId: 'ghi',
        cohort: '123',
      })

      expect(ctx.util.fetch).to.have.been.calledOnceWith(
        sinon.match(/anon-collect$/), // Verify URL ends with expected 'anon-collect' path
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cypress-version': pkg.version }, body: '{"campaign":"abc","medium":"def","messageId":"ghi","cohort":"123"}' },
      )
    })

    it('resolve true if request succeeds', async () => {
      (ctx.util.fetch as SinonStub).resolves({} as any)

      const result = await actions.recordEvent({ campaign: '', medium: '', messageId: '', cohort: '' })

      expect(result).to.eql(true)
    })

    it('resolves false if request fails', async () => {
      (ctx.util.fetch as SinonStub).rejects({} as any)

      const result = await actions.recordEvent({ campaign: '', medium: '', messageId: '', cohort: '' })

      expect(result).to.eql(false)
    })
  })
})
