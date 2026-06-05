import { proxyquire } from '../../spec_helper'
import { expect } from 'chai'
import utils from '../../../lib/browsers/utils'
import * as plugins from '../../../lib/plugins'

function getWebkit (dependencies = {}) {
  return proxyquire('../lib/browsers/webkit', dependencies) as typeof import('../../../lib/browsers/webkit')
}

describe('lib/browsers/webkit', () => {
  context('#open', () => {
    let browser
    let options
    let automation
    let webkit

    beforeEach(async () => {
      browser = {}
      options = { experimentalWebKitSupport: true }
      automation = { use: sinon.stub() }

      const launchOptions = {
        extensions: [],
        args: [],
        preferences: { },
      }
      const pwWebkit = {
        webkit: {
          connect: sinon.stub().resolves({
            on: sinon.stub(),
          }),
          launchServer: sinon.stub().resolves({
            wsEndpoint: sinon.stub().returns('ws://debugger'),
            process: sinon.stub().returns({ pid: 'pid' }),
          }),
        },
      }
      const wkAutomation = {
        WebKitAutomation: {
          create: sinon.stub().resolves({}),
        },
      }

      sinon.stub(utils, 'executeBeforeBrowserLaunch').resolves(launchOptions as any)
      sinon.stub(plugins, 'execute').resolves()
      sinon.stub(plugins, 'has')

      webkit = getWebkit({
        'playwright-webkit': pwWebkit,
        './webkit-automation': wkAutomation,
      })
    })

    it('sends after:browser:launch with debugger url', async () => {
      (plugins.has as any).returns(true)

      await webkit.open(browser as any, 'http://the.url', options as any, automation as any)

      expect(plugins.execute).to.be.calledWith('after:browser:launch', browser, {
        webSocketDebuggerUrl: 'ws://debugger',
      })
    })

    it('executeAfterBrowserLaunch is noop if after:browser:launch is not registered', async () => {
      (plugins.has as any).returns(false)

      await webkit.open(browser as any, 'http://the.url', options as any, automation as any)

      expect(plugins.execute).not.to.be.calledWith('after:browser:launch')
    })

    // https://github.com/cypress-io/cypress/issues/27141
    // Playwright registers a process `exit` listener that re-spawns the current binary to
    // run a cleanup script. With Electron's binary this is interpreted as `cypress open`
    // (no args), causing interactive mode to launch after a `cypress run` completes. The
    // listener has been named `killProcessAndCleanup` (<= 1.34) and `exitHandler` (>= 1.35).
    ;['killProcessAndCleanup', 'exitHandler'].forEach((listenerName) => {
      it(`removes Playwright's '${listenerName}' exit listener`, async () => {
        // create a listener whose function name matches the one Playwright registers
        const badExitListener = { [listenerName]: () => {} }[listenerName]

        process.on('exit', badExitListener)

        try {
          expect(process.rawListeners('exit')).to.include(badExitListener)

          await webkit.open(browser as any, 'http://the.url', options as any, automation as any)

          expect(process.rawListeners('exit')).not.to.include(badExitListener)
        } finally {
          process.removeListener('exit', badExitListener)
        }
      })
    })
  })

  context('#connectProtocolToBrowser', () => {
    it('throws error', () => {
      const webkit = getWebkit()

      expect(webkit.connectProtocolToBrowser).to.throw('Protocol is not yet supported in WebKit.')
    })
  })

  context('#closeProtocolConnection', () => {
    it('throws error', async () => {
      const webkit = getWebkit()

      expect(webkit.closeProtocolConnection).to.throw('Protocol is not yet supported in WebKit.')
    })
  })
})
