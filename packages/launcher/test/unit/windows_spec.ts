import _ from 'lodash'
import { expect } from 'chai'
import * as windowsHelper from '../../lib/windows'
import { normalize } from 'path'
import sinon, { SinonStub } from 'sinon'
import { knownBrowsers } from '../../lib/known-browsers'
import Bluebird from 'bluebird'
import fse from 'fs-extra'
import os from 'os'
import snapshot from 'snap-shot-it'
import type { Browser } from '@packages/types'
import { detectByPath } from '../../lib/detect'
import { goalBrowsers } from '../fixtures'

function stubBrowser (path: string, version: string) {
  path = windowsHelper.doubleEscape(normalize(path))

  ;(windowsHelper.getVersionString as unknown as SinonStub)
  .withArgs(path)
  .resolves(version)

  ;(fse.pathExists as SinonStub)
  .withArgs(path)
  .resolves(true)
}

function detect (goalBrowsers: Browser[]) {
  return Bluebird.mapSeries(goalBrowsers, (browser) => {
    return windowsHelper.detect(browser)
    .then((foundBrowser) => {
      return _.merge(browser, foundBrowser)
    })
  })
}

const HOMEDIR = 'C:/Users/flotwig'

describe('windows browser detection', () => {
  beforeEach(() => {
    sinon.stub(fse, 'pathExists').resolves(false)
    sinon.stub(os, 'homedir').returns(HOMEDIR)
    sinon.stub(windowsHelper, 'getVersionString').rejects()
  })

  it('detects browsers as expected', async () => {
    // chrome
    stubBrowser('C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '1.2.3')
    // chromium - 32-bit will be preferred for passivity
    stubBrowser('C:/Program Files (x86)/Google/chrome-win32/chrome.exe', '2.3.4')
    stubBrowser('C:/Program Files/Google/chrome-win/chrome.exe', '2.3.4')

    // chrome-for-testing - 64-bit will be preferred
    stubBrowser('C:/Program Files (x86)/Google/Chrome for Testing/chrome.exe', '1.2.3')
    stubBrowser('C:/Program Files/Google/Chrome for Testing/chrome.exe', '1.2.3')

    // chrome beta
    stubBrowser('C:/Program Files (x86)/Google/Chrome Beta/Application/chrome.exe', '6.7.8')

    // chrome canary is installed in homedir
    stubBrowser(`${HOMEDIR}/AppData/Local/Google/Chrome SxS/Application/chrome.exe`, '3.4.5')

    // have 32-bit and 64-bit ff - 64-bit will be preferred
    stubBrowser('C:/Program Files (x86)/Mozilla Firefox/firefox.exe', '72')
    stubBrowser('C:/Program Files/Mozilla Firefox/firefox.exe', '72')

    // 32-bit dev edition
    stubBrowser('C:/Program Files (x86)/Firefox Developer Edition/firefox.exe', '73')

    // 64-bit nightly edition
    stubBrowser('C:/Program Files/Firefox Nightly/firefox.exe', '74')

    stubBrowser('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '11')
    stubBrowser('C:/Program Files (x86)/Microsoft/Edge Beta/Application/msedge.exe', '12')
    stubBrowser('C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe', '13')

    // edge canary is installed in homedir
    stubBrowser(`${HOMEDIR}/AppData/Local/Microsoft/Edge SxS/Application/msedge.exe`, '14')

    snapshot(await detect(knownBrowsers))
  })

  it('detects Chrome Beta 64-bit install', async () => {
    stubBrowser('C:/Program Files/Google/Chrome Beta/Application/chrome.exe', '9.0.1')
    const chrome = _.find(knownBrowsers, { name: 'chrome', channel: 'beta' })!

    snapshot(await detect([chrome]))
  })

  // @see https://github.com/cypress-io/cypress/issues/8425
  it('detects Chrome 64-bit install', async () => {
    stubBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', '4.4.4')
    const chrome = _.find(knownBrowsers, { name: 'chrome', channel: 'stable' })!

    snapshot(await detect([chrome]))
  })

  it('detects Chrome for Testing 32-bit install', async () => {
    stubBrowser('C:/Program Files (x86)/Google/Chrome for Testing/chrome.exe', '5.5.5')
    const chromeForTesting = _.find(knownBrowsers, { name: 'chrome-for-testing' })!

    snapshot(await detect([chromeForTesting]))
  })

  // @see https://github.com/cypress-io/cypress/issues/8432
  it('detects Firefox local installs', async () => {
    stubBrowser(`${HOMEDIR}/AppData/Local/Mozilla Firefox/firefox.exe`, '100')
    stubBrowser(`${HOMEDIR}/AppData/Local/Firefox Nightly/firefox.exe`, '200')
    stubBrowser(`${HOMEDIR}/AppData/Local/Firefox Developer Edition/firefox.exe`, '300')

    const firefoxes = _.filter(knownBrowsers, { family: 'firefox' })

    snapshot(await detect(firefoxes))
  })

  it('detects Chromium 64-bit install', async () => {
    stubBrowser('C:/Program Files/Google/chrome-win/chrome.exe', '6.6.6')
    const chromium = _.find(knownBrowsers, { name: 'chromium' })!

    snapshot(await detect([chromium]))
  })

  it('detects Chromium 32-bit install in Chromium folder', async () => {
    stubBrowser('C:/Program Files (x86)/Google/Chromium/chrome.exe', '7.7.7')
    const chromium = _.find(knownBrowsers, { name: 'chromium' })!

    snapshot(await detect([chromium]))
  })

  it('detects Chromium 64-bit install in Chromium folder', async () => {
    stubBrowser('C:/Program Files/Google/Chromium/chrome.exe', '8.8.8')
    const chromium = _.find(knownBrowsers, { name: 'chromium' })!

    snapshot(await detect([chromium]))
  })

  it('works with :browserName format in Windows', () => {
    sinon.stub(os, 'platform').returns('win32')
    let path = `${HOMEDIR}/foo/bar/browser.exe`
    let win10Path = windowsHelper.doubleEscape(path)

    stubBrowser(path, '100')

    return detectByPath(`${path}:foo-browser`, goalBrowsers as Browser[]).then((browser) => {
      expect(browser).to.deep.equal(
        Object.assign({}, goalBrowsers.find((gb) => {
          return gb.name === 'foo-browser'
        }), {
          displayName: 'Custom Foo Browser',
          info: `Loaded from ${win10Path}`,
          custom: true,
          version: '100',
          majorVersion: '100',
          path: win10Path,
        }),
      )
    })
  })

  it('identifies browser if name in path', async () => {
    sinon.stub(os, 'platform').returns('win32')
    let path = `${HOMEDIR}/foo/bar/chrome.exe`
    let win10Path = windowsHelper.doubleEscape(path)

    stubBrowser(path, '100')

    return detectByPath(path).then((browser) => {
      expect(browser).to.deep.equal(
        Object.assign({}, knownBrowsers.find((gb) => {
          return gb.name === 'chrome'
        }), {
          displayName: 'Custom Chrome',
          info: `Loaded from ${win10Path}`,
          custom: true,
          version: '100',
          majorVersion: '100',
          path: win10Path,
        }),
      )
    })
  })

  context('#getVersionString', () => {
    it('returns the FileVersion from win-version-info', async () => {
      stubBrowser('foo', 'bar')

      expect(await windowsHelper.getVersionString('foo')).to.eq('bar')
    })
  })

  context('#getPathData', () => {
    it('returns path and browserKey given path with browser key', () => {
      const browserPath = 'C:\\foo\\bar.exe'
      const res = windowsHelper.getPathData(`${browserPath}:firefox`)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('firefox')
    })

    it('returns path and browserKey given path with a lot of slashes plus browser key', () => {
      const browserPath = 'C:\\\\\\\\foo\\\\\\bar.exe'
      const res = windowsHelper.getPathData(`${browserPath}:firefox`)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('firefox')
    })

    it('returns path and browserKey given nix path with browser key', () => {
      const browserPath = 'C:/foo/bar.exe'
      const res = windowsHelper.getPathData(`${browserPath}:firefox`)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('firefox')
    })

    it('returns path and chrome given just path', () => {
      const browserPath = 'C:\\foo\\bar\\chrome.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('chrome')
    })

    it('returns path and chrome given just nix path', () => {
      const browserPath = 'C:/foo/bar/chrome.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('chrome')
    })

    it('returns path and edge given just path for edge', () => {
      const browserPath = 'C:\\foo\\bar\\edge.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('edge')
    })

    it('returns path and edge given just path for msedge', () => {
      const browserPath = 'C:\\foo\\bar\\msedge.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('edge')
    })

    it('returns path and edge given just nix path', () => {
      const browserPath = 'C:/foo/bar/edge.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('edge')
    })

    it('returns path and edge given just nix path for msedge', () => {
      const browserPath = 'C:/foo/bar/msedge.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('edge')
    })

    it('returns path and firefox given just path', () => {
      const browserPath = 'C:\\foo\\bar\\firefox.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('firefox')
    })

    it('returns path and firefox given just nix path', () => {
      const browserPath = 'C:/foo/bar/firefox.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).to.eq(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).to.eq('firefox')
    })
  })

  context('#doubleEscape', () => {
    let winPath = 'C:\\\\foo\\\\bar.exe'

    it('converts nix path into double escaped win path', async () => {
      let nixPath = 'C:/foo/bar.exe'

      expect(windowsHelper.doubleEscape(nixPath)).to.eq(winPath)
    })

    it('converts win path with different backslash combination into double escaped win path', async () => {
      let badWinPath = 'C:\\\\\\\\\\foo\\bar.exe'

      expect(windowsHelper.doubleEscape(badWinPath)).to.eq(winPath)
    })

    it('converts single escaped win path into double escaped win path', async () => {
      let badWinPath = 'C:\\foo\\bar.exe'

      expect(windowsHelper.doubleEscape(badWinPath)).to.eq(winPath)
    })

    it('does not affect an already double escaped win path', async () => {
      let badWinPath = 'C:\\\\foo\\\\bar.exe'

      expect(windowsHelper.doubleEscape(badWinPath)).to.eq(badWinPath)
    })
  })
})
