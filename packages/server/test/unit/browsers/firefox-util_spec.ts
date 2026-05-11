require('../../spec_helper')
import FirefoxUtil from '../../../lib/browsers/firefox-util'
import sinon from 'sinon'
import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
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

      it('retries sessionSubscribe when the BiDi connection is not ready yet', async () => {
        const notReadyErr = new Error('Error: No connection to WebDriver Bidi was established')

        webdriverClient.sessionSubscribe!
        .onFirstCall().rejects(notReadyErr)
        .onSecondCall().rejects(notReadyErr)
        .onThirdCall().resolves()

        await FirefoxUtil.setup({ automation, onError, url, remotePort, webdriverClient, useWebDriverBiDi })

        expect(webdriverClient.sessionSubscribe).to.have.callCount(3)
        expect(automation.use).to.have.been.calledWith(stubbedBiDiAutomation.automationMiddleware)
      })

      // Guards against silent breakage if webdriver.io reworks the error
      // thrown by `BidiHandler.sendAsync`. If this test fails after a
      // webdriver bump, revisit the message constant in firefox-util.ts (or
      // switch to a typed-error check if upstream has added one).
      it('matches the error message thrown by the installed webdriver package', () => {
        const webdriverPkgEntry = require.resolve('webdriver')
        const webdriverBuildDir = path.dirname(webdriverPkgEntry)
        const candidates = fs.readdirSync(webdriverBuildDir)
        .filter((f) => f.endsWith('.js'))
        .map((f) => path.join(webdriverBuildDir, f))

        const found = candidates.some((file) => {
          return fs.readFileSync(file, 'utf8').includes('No connection to WebDriver Bidi was established')
        })

        expect(found, 'expected webdriver package to still throw "No connection to WebDriver Bidi was established"').to.be.true
      })

      it('does not retry sessionSubscribe on unrelated errors', async () => {
        const fatalErr = new Error('something else went wrong')

        webdriverClient.sessionSubscribe!.rejects(fatalErr)

        let caught: Error | undefined

        try {
          await FirefoxUtil.setup({ automation, onError, url, remotePort, webdriverClient, useWebDriverBiDi })
        } catch (err) {
          caught = err as Error
        }

        expect(caught).to.equal(fatalErr)
        expect(webdriverClient.sessionSubscribe).to.have.callCount(1)
      })
    })
  })
})
