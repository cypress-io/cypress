import type { DataContext } from '../../../src'
import { EventCollectorActions } from '../../../src/actions/EventCollectorActions'
import { createTestDataContext } from '../helper'
import sinon, { SinonStub } from 'sinon'
import sinonChai from 'sinon-chai'
import chai, { expect } from 'chai'

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
      })

      expect(ctx.util.fetch).to.have.been.calledOnceWith(
        'https://dashboard-staging.cypress.io/anon-collect',
        { method: 'POST', body: '{"campaign":"abc","medium":"def","messageId":"ghi"}' },
      )
    })

    it('resolve true if request succeeds', async () => {
      (ctx.util.fetch as SinonStub).resolves({} as any)

      const result = await actions.recordEvent({ campaign: '', medium: '', messageId: '' })

      expect(result).to.eql(true)
    })

    it('resolves false if request fails', async () => {
      (ctx.util.fetch as SinonStub).rejects({} as any)

      const result = await actions.recordEvent({ campaign: '', medium: '', messageId: '' })

      expect(result).to.eql(false)
    })
  })
})
