require('../../spec_helper')
import FirefoxUtil from '../../../lib/browsers/firefox-util'
import sinon from 'sinon'
import { expect } from 'chai'
import { Automation } from '../../../lib/automation'
import { Client as WebDriverClient } from 'webdriver'
import { BidiAutomation } from '../../../lib/browsers/bidi_automation'

describe('Firefox-Util', () => {
  let automation: sinon.SinonStubbedInstance<Automation>
  let onError: sinon.SinonStub<[Error], void>
  let url: string
  let remotePort: number | undefined
  let webdriverClient: Partial<sinon.SinonStubbedInstance<WebDriverClient>>
  let useWebDriverBiDi: boolean
  let stubbedBiDiAutomation: sinon.SinonStubbedInstance<BidiAutomation>

  beforeEach(() => {
    automation = sinon.createStubInstance(Automation)
    onError = sinon.stub<[Error], void>()
    url = 'http://some-url'
    remotePort = 8000
    webdriverClient = {
      sessionSubscribe: sinon.stub<
        Parameters<WebDriverClient['sessionSubscribe']>,
        ReturnType<WebDriverClient['sessionSubscribe']>
      >().resolves(),
      browsingContextGetTree: sinon.stub<
        Parameters<WebDriverClient['browsingContextGetTree']>,
        ReturnType<WebDriverClient['browsingContextGetTree']>
      >().resolves({ contexts: [{
        context: 'abc',
        children: [],
        url: 'http://some-url',
        userContext: 'user-context',
      }] }),
      browsingContextNavigate: sinon.stub<
        Parameters<WebDriverClient['browsingContextNavigate']>,
        ReturnType<WebDriverClient['browsingContextNavigate']>
      >().resolves(),
    }

    useWebDriverBiDi = true
    stubbedBiDiAutomation = sinon.createStubInstance(BidiAutomation)
    // sinon's createStubInstance doesn't stub out this member method
    stubbedBiDiAutomation.setTopLevelContextId = sinon.stub()
    sinon.stub(BidiAutomation, 'create').returns(stubbedBiDiAutomation)
  })

  describe('.setup()', () => {
    describe('when using bidi', () => {
      it('registers the automation middleware with the automation system', async () => {
        await FirefoxUtil.setup({ automation, onError, url, remotePort, webdriverClient, useWebDriverBiDi })
        expect(automation.use).to.have.been.calledWith(stubbedBiDiAutomation.automationMiddleware)
      })
    })
  })
})
