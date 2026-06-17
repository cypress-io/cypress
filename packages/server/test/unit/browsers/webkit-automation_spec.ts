const { expect, sinon } = require('../../spec_helper')

import { WebKitAutomation } from '../../../lib/browsers/webkit-automation'

context('lib/browsers/webkit-automation', () => {
  context('.create', () => {
    let browser
    let context
    let page
    let automation

    beforeEach(() => {
      context = {
        exposeBinding: sinon.stub().resolves(),
        route: sinon.stub().resolves(),
      }

      page = {
        context: sinon.stub().returns(context),
        addInitScript: sinon.stub().resolves(),
        on: sinon.stub(),
        goto: sinon.stub().resolves(),
      }

      browser = {
        newContext: sinon.stub().resolves({
          newPage: sinon.stub().resolves(page),
        }),
      }

      automation = { use: sinon.stub() }
    })

    const create = (isHeadless: boolean) => {
      return WebKitAutomation.create({
        automation,
        browser: browser as any,
        initialUrl: 'http://foo',
        downloadsFolder: '',
        isHeadless,
      })
    }

    it('sets deviceScaleFactor to 1 when headless', async () => {
      await create(true)

      expect(browser.newContext).to.be.calledOnce
      expect(browser.newContext.firstCall.args[0]).to.include({ deviceScaleFactor: 1 })
    })

    it('does not set deviceScaleFactor when headed', async () => {
      await create(false)

      expect(browser.newContext).to.be.calledOnce
      expect(browser.newContext.firstCall.args[0]).not.to.have.property('deviceScaleFactor')
    })
  })
})
