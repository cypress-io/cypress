import { proxyquire } from '../../spec_helper'
import { expect } from 'chai'
import os from 'os'
import path from 'path'
import utils from '../../../lib/browsers/utils'
import { fs } from '../../../lib/util/fs'
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
  })

  context('utils.getWebKitBrowserVersion', () => {
    it('returns the webkit browserVersion from playwright-core browsers.json', async () => {
      sinon.stub(fs, 'readFile').resolves(JSON.stringify({
        browsers: [
          { name: 'chromium', browserVersion: '140.0.7339.5' },
          { name: 'webkit', browserVersion: '26.5' },
        ],
      }))

      expect(await utils.getWebKitBrowserVersion()).to.equal('26.5')
    })

    it(`returns '0' when there is no webkit entry`, async () => {
      sinon.stub(fs, 'readFile').resolves(JSON.stringify({
        browsers: [{ name: 'chromium', browserVersion: '140.0.7339.5' }],
      }))

      expect(await utils.getWebKitBrowserVersion()).to.equal('0')
    })

    it(`returns '0' when the webkit entry has no browserVersion`, async () => {
      sinon.stub(fs, 'readFile').resolves(JSON.stringify({
        browsers: [{ name: 'webkit' }],
      }))

      expect(await utils.getWebKitBrowserVersion()).to.equal('0')
    })

    it(`returns '0' when browsers.json cannot be read`, async () => {
      sinon.stub(fs, 'readFile').rejects(new Error('ENOENT'))

      expect(await utils.getWebKitBrowserVersion()).to.equal('0')
    })

    // verifies the monorepo's pinned playwright-core ships a browsers.json with a
    // webkit browserVersion, so the detection path resolves to a real version rather
    // than falling back to '0' (see cypress-io/cypress#33974 and #33969)
    it('detects a real version from the installed playwright-core', async () => {
      const pwCorePath = path.dirname(require.resolve('playwright-core', { paths: [process.cwd()] }))
      const browsersJson = JSON.parse(await fs.readFile(path.join(pwCorePath, 'browsers.json'), 'utf8'))
      const expectedVersion = browsersJson.browsers.find((b) => b.name === 'webkit').browserVersion

      expect(expectedVersion).not.to.equal('0')
      expect(await utils.getWebKitBrowserVersion()).to.equal(expectedVersion)
    })

    // regression: in system tests the project runs from a temp dir outside the
    // monorepo where only playwright-webkit is symlinked, so playwright-core is
    // not resolvable from process.cwd() and the version used to fall back to '0'
    // (displaying "WebKit 0"). Resolving playwright-core via the playwright-webkit
    // module path fixes this. See cypress-io/cypress#34101.
    it('resolves playwright-core via the playwright-webkit module path when cwd cannot resolve it', async () => {
      const pwWebkitModulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] })

      // simulate the project running outside the monorepo (a system-test temp dir)
      sinon.stub(process, 'cwd').returns(os.tmpdir())

      expect(await utils.getWebKitBrowserVersion(pwWebkitModulePath)).not.to.equal('0')
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
