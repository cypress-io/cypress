import { proxyquire } from '../../spec_helper'
import { expect } from 'chai'
import utils, { getWebKitBrowserVersion } from '../../../lib/browsers/utils'
import * as plugins from '../../../lib/plugins'
import { fs } from '../../../lib/util/fs'
import path from 'path'

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
  })

  context('#getWebKitBrowserVersion', () => {
    const pwCorePath = '/fake/playwright-core'
    const wkBrowserPath = path.join(pwCorePath, 'lib', 'server', 'webkit', 'wkBrowser.js')
    const browsersJsonPath = path.join(pwCorePath, 'browsers.json')

    it('reads the version from wkBrowser.js when available', async () => {
      sinon.stub(fs, 'readFile')
      .withArgs(wkBrowserPath, 'utf8').resolves('const BROWSER_VERSION = \'18.4\';')

      expect(await getWebKitBrowserVersion(pwCorePath)).to.eq('18.4')
    })

    // https://github.com/cypress-io/cypress/issues/33953
    it('falls back to browsers.json when wkBrowser.js is not shipped (playwright-core >= 1.60.0)', async () => {
      sinon.stub(fs, 'readFile')
      .withArgs(wkBrowserPath, 'utf8').rejects(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
      .withArgs(browsersJsonPath, 'utf8').resolves(JSON.stringify({
        browsers: [
          { name: 'chromium', browserVersion: '148.0' },
          { name: 'webkit', browserVersion: '26.4' },
        ],
      }))

      expect(await getWebKitBrowserVersion(pwCorePath)).to.eq('26.4')
    })

    it('returns "0" when neither source yields a version', async () => {
      sinon.stub(fs, 'readFile')
      .withArgs(wkBrowserPath, 'utf8').rejects(new Error('ENOENT'))
      .withArgs(browsersJsonPath, 'utf8').rejects(new Error('ENOENT'))

      expect(await getWebKitBrowserVersion(pwCorePath)).to.eq('0')
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
