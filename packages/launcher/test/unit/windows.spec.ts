import { describe, it, expect, beforeEach, vi } from 'vitest'
import winVersionInfo from 'win-version-info'
import _ from 'lodash'
import * as windowsHelper from '../../lib/windows'
import { knownBrowsers } from '../../lib/known-browsers'
import fs from 'fs-extra'
import os from 'os'
import type { Browser } from '@packages/types'
import { detectByPath } from '../../lib/detect'
import { goalBrowsers } from '../fixtures'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      homedir: vi.fn(),
      platform: vi.fn(),
    },
  }
})

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      pathExists: vi.fn(),
    },
  }
})

vi.mock('win-version-info', () => {
  return {
    default: vi.fn(),
  }
})

describe('windows browser detection', () => {
  const HOMEDIR = 'C:/Users/flotwig'

  let mockBrowsers: { path: string, version: string }[] = []

  beforeEach(() => {
    vi.resetAllMocks()
    mockBrowsers = [
      // chrome
      {
        path: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        version: '1.2.3',
      },
      // chromium - 32-bit will be preferred for passivity
      {
        path: 'C:/Program Files (x86)/Google/chrome-win32/chrome.exe',
        version: '2.3.4',
      },
      {
        path: 'C:/Program Files/Google/chrome-win/chrome.exe',
        version: '2.3.4',
      },
      // chrome-for-testing - 64-bit will be preferred
      {
        path: 'C:/Program Files (x86)/Google/Chrome for Testing/chrome.exe',
        version: '1.2.3',
      },
      {
        path: 'C:/Program Files/Google/Chrome for Testing/chrome.exe',
        version: '1.2.3',
      },
      // chrome beta
      {
        path: 'C:/Program Files (x86)/Google/Chrome Beta/Application/chrome.exe',
        version: '6.7.8',
      },
      // chrome canary is installed in homedir
      {
        path: `${HOMEDIR}/AppData/Local/Google/Chrome SxS/Application/chrome.exe`,
        version: '3.4.5',
      },
      // have 32-bit and 64-bit ff - 64-bit will be preferred
      {
        path: 'C:/Program Files (x86)/Mozilla Firefox/firefox.exe',
        version: '72',
      },
      {
        path: 'C:/Program Files/Mozilla Firefox/firefox.exe',
        version: '72',
      },
      // 32-bit dev edition
      {
        path: 'C:/Program Files (x86)/Firefox Developer Edition/firefox.exe',
        version: '73',
      },
      // 64-bit nightly edition
      {
        path: 'C:/Program Files/Firefox Nightly/firefox.exe',
        version: '74',
      },
      {
        path: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        version: '11',
      },
      {
        path: 'C:/Program Files (x86)/Microsoft/Edge Beta/Application/msedge.exe',
        version: '12',
      },
      {
        path: 'C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe',
        version: '13',
      },
      {
        // edge canary is installed in homedir
        path: `${HOMEDIR}/AppData/Local/Microsoft/Edge SxS/Application/msedge.exe`,
        version: '14',
      },
    ]

    vi.mocked(os.homedir).mockReturnValue(HOMEDIR)
    vi.mocked(os.platform).mockReturnValue('win32')

    vi.mocked(fs.pathExists).mockImplementation((path) => {
      const browser = mockBrowsers.find((browser) => windowsHelper.doubleEscape(browser.path) === path)

      if (!browser) {
        return Promise.resolve(false)
      }

      return Promise.resolve(true)
    })

    vi.mocked(winVersionInfo).mockImplementation((path) => {
      const browser = mockBrowsers.find((browser) => windowsHelper.doubleEscape(browser.path) === path)

      if (!browser) {
        throw new Error('Browser not found')
      }

      return { FileVersion: browser?.version }
    })
  })

  it('detects browsers as expected', async () => {
    const mappedBrowsers = []

    for (const browser of knownBrowsers) {
      const foundBrowser = await windowsHelper.detect(browser)

      mappedBrowsers.push({
        ...browser,
        ...foundBrowser,
      })
    }

    expect(mappedBrowsers).toMatchSnapshot()
  })

  it('detects Chrome Beta 64-bit install', async () => {
    // mock installing the 64-bit (32-bit installed already in mockBrowsers)
    // should prefer the 64-bit install over the 32-bit install
    mockBrowsers.push({
      path: 'C:/Program Files/Google/Chrome Beta/Application/chrome.exe',
      version: '9.0.1',
    })

    const chrome = _.find(knownBrowsers, { name: 'chrome', channel: 'beta' })! as Browser

    const foundBrowser = await windowsHelper.detect(chrome)

    const snapshotBrowser = {
      ...chrome,
      ...foundBrowser,
    }

    expect(snapshotBrowser.version).toEqual('9.0.1')
    expect(snapshotBrowser).toMatchSnapshot()
  })

  // @see https://github.com/cypress-io/cypress/issues/8425
  it('detects Chrome 64-bit install', async () => {
    // mock installing the 64-bit (32-bit installed already in mockBrowsers)
    // should prefer the 64-bit install over the 32-bit install
    mockBrowsers.push({
      path: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      version: '4.4.4',
    })

    const chrome = _.find(knownBrowsers, { name: 'chrome', channel: 'stable' })! as Browser

    const foundBrowser = await windowsHelper.detect(chrome)

    const snapshotBrowser = {
      ...chrome,
      ...foundBrowser,
    }

    expect(snapshotBrowser.version).toEqual('4.4.4')
    expect(snapshotBrowser).toMatchSnapshot()
  })

  it('detects Chrome for Testing 32-bit install', async () => {
    // mock uninstalling the 32-bit and 64-bit
    const foundCFTInstalls = _.remove(mockBrowsers, (browser) => browser.path.includes('Chrome for Testing'))

    expect(foundCFTInstalls).toHaveLength(2)

    // mock installing the 32-bit
    mockBrowsers.push({
      path: 'C:/Program Files (x86)/Google/Chrome for Testing/chrome.exe',
      version: '5.5.5',
    })

    const chromeForTesting = _.find(knownBrowsers, { name: 'chrome-for-testing' })!

    const foundBrowser = await windowsHelper.detect(chromeForTesting)

    const snapshotBrowser = {
      ...chromeForTesting,
      ...foundBrowser,
    }

    expect(snapshotBrowser.version).toEqual('5.5.5')
    expect(snapshotBrowser).toMatchSnapshot()
  })

  // @see https://github.com/cypress-io/cypress/issues/8432
  it('detects Firefox local installs', async () => {
    // mock uninstalling Firefox in the Program Files directory
    const foundFirefoxInstalls = _.remove(mockBrowsers, (browser) => browser.path.includes('Firefox'))

    expect(foundFirefoxInstalls).toHaveLength(4)

    // mock installing Firefox in the local app data directory
    mockBrowsers.push({
      path: `${HOMEDIR}/AppData/Local/Mozilla Firefox/firefox.exe`,
      version: '100',
    })

    mockBrowsers.push({
      path: `${HOMEDIR}/AppData/Local/Firefox Nightly/firefox.exe`,
      version: '200',
    })

    mockBrowsers.push({
      path: `${HOMEDIR}/AppData/Local/Firefox Developer Edition/firefox.exe`,
      version: '300',
    })

    const firefoxBrowsers = _.filter(knownBrowsers, { family: 'firefox' })

    const mappedBrowsers = []

    for (const browser of firefoxBrowsers) {
      const foundBrowser = await windowsHelper.detect(browser)

      mappedBrowsers.push({
        ...browser,
        ...foundBrowser,
      })
    }

    expect(mappedBrowsers.map((browser) => browser.version).sort()).toEqual(['100', '200', '300'])
    expect(mappedBrowsers).toMatchSnapshot()
  })

  it('detects Chromium 64-bit install', async () => {
    // mock updating the 64-bit install of chrome
    const foundChromiumInstalls = _.remove(mockBrowsers, (browser) => browser.path === 'C:/Program Files/Google/chrome-win/chrome.exe')

    expect(foundChromiumInstalls).toHaveLength(1)

    mockBrowsers.push({
      path: 'C:/Program Files/Google/chrome-win/chrome.exe',
      version: '6.6.6',
    })

    const chromium = _.find(knownBrowsers, { name: 'chromium' })!

    const foundBrowser = await windowsHelper.detect(chromium)

    const snapshotBrowser = {
      ...chromium,
      ...foundBrowser,
    }

    expect(snapshotBrowser.version).toEqual('6.6.6')
    expect(snapshotBrowser).toMatchSnapshot()
  })

  it('detects Chromium 32-bit install in Chromium folder', async () => {
    // mock uninstalling the 64-bit and 32-bit in the Google path
    const foundChromiumInstalls = _.remove(mockBrowsers, (browser) => browser.path.includes('chrome-win'))

    expect(foundChromiumInstalls).toHaveLength(2)

    // mock installing the 32-bit
    mockBrowsers.push({
      path: 'C:/Program Files (x86)/Google/Chromium/chrome.exe',
      version: '7.7.7',
    })

    const chromium = _.find(knownBrowsers, { name: 'chromium' })!

    const foundBrowser = await windowsHelper.detect(chromium)

    const snapshotBrowser = {
      ...chromium,
      ...foundBrowser,
    }

    expect(snapshotBrowser.version).toEqual('7.7.7')
    expect(snapshotBrowser).toMatchSnapshot()
  })

  it('detects Chromium 64-bit install in Chromium folder', async () => {
    // mock uninstalling the 64-bit and 32-bit in the Google path
    const foundChromiumInstalls = _.remove(mockBrowsers, (browser) => browser.path.includes('chrome-win'))

    expect(foundChromiumInstalls).toHaveLength(2)

    // mock installing the 32-bit
    mockBrowsers.push({
      path: 'C:/Program Files/Google/Chromium/chrome.exe',
      version: '8.8.8',
    })

    const chromium = _.find(knownBrowsers, { name: 'chromium' })!

    const foundBrowser = await windowsHelper.detect(chromium)

    const snapshotBrowser = {
      ...chromium,
      ...foundBrowser,
    }

    expect(snapshotBrowser.version).toEqual('8.8.8')
    expect(snapshotBrowser).toMatchSnapshot()
  })

  it('works with :browserName format in Windows', async () => {
    let path = `${HOMEDIR}/foo/bar/browser.exe`
    let win10Path = windowsHelper.doubleEscape(path)

    mockBrowsers.push({
      path,
      version: '100',
    })

    const foundBrowser = await detectByPath(`${path}:foo-browser`, goalBrowsers as Browser[])

    const fooBrowser = goalBrowsers.find(({ name }) => name === 'foo-browser')!

    expect(foundBrowser).toEqual(
      {
        ...fooBrowser,
        displayName: 'Custom Foo Browser',
        info: `Loaded from ${win10Path}`,
        custom: true,
        version: '100',
        majorVersion: '100',
        path: win10Path,
      },
    )
  })

  it('identifies browser if name in path', async () => {
    let path = `${HOMEDIR}/foo/bar/chrome.exe`
    let win10Path = windowsHelper.doubleEscape(path)

    mockBrowsers.push({
      path,
      version: '100',
    })

    const foundBrowser = await detectByPath(path)

    const chromeBrowser = knownBrowsers.find(({ name }) => name === 'chrome')!

    expect(foundBrowser).toEqual(
      {
        ...chromeBrowser,
        displayName: 'Custom Chrome',
        info: `Loaded from ${win10Path}`,
        custom: true,
        version: '100',
        majorVersion: '100',
        path: win10Path,
      },
    )
  })

  describe('#getVersionString', () => {
    it('returns the FileVersion from win-version-info', async () => {
      mockBrowsers.push({
        path: 'foo',
        version: 'bar',
      })

      const versionString = await windowsHelper.getVersionString('foo')

      expect(versionString).toEqual('bar')
    })
  })

  describe('#getPathData', () => {
    it('returns path and browserKey given path with browser key', () => {
      const browserPath = 'C:\\foo\\bar.exe'
      const res = windowsHelper.getPathData(`${browserPath}:firefox`)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('firefox')
    })

    it('returns path and browserKey given path with a lot of slashes plus browser key', () => {
      const browserPath = 'C:\\\\\\\\foo\\\\\\bar.exe'
      const res = windowsHelper.getPathData(`${browserPath}:firefox`)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('firefox')
    })

    it('returns path and browserKey given nix path with browser key', () => {
      const browserPath = 'C:/foo/bar.exe'
      const res = windowsHelper.getPathData(`${browserPath}:firefox`)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('firefox')
    })

    it('returns path and chrome given just path', () => {
      const browserPath = 'C:\\foo\\bar\\chrome.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('chrome')
    })

    it('returns path and chrome given just nix path', () => {
      const browserPath = 'C:/foo/bar/chrome.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('chrome')
    })

    it('returns path and edge given just path for edge', () => {
      const browserPath = 'C:\\foo\\bar\\edge.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('edge')
    })

    it('returns path and edge given just path for msedge', () => {
      const browserPath = 'C:\\foo\\bar\\msedge.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('edge')
    })

    it('returns path and edge given just nix path', () => {
      const browserPath = 'C:/foo/bar/edge.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('edge')
    })

    it('returns path and edge given just nix path for msedge', () => {
      const browserPath = 'C:/foo/bar/msedge.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('edge')
    })

    it('returns path and firefox given just path', () => {
      const browserPath = 'C:\\foo\\bar\\firefox.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('firefox')
    })

    it('returns path and firefox given just nix path', () => {
      const browserPath = 'C:/foo/bar/firefox.exe'
      const res = windowsHelper.getPathData(browserPath)

      expect(res.path).toEqual(windowsHelper.doubleEscape(browserPath))
      expect(res.browserKey).toEqual('firefox')
    })
  })

  describe('#doubleEscape', () => {
    let winPath = 'C:\\\\foo\\\\bar.exe'

    it('converts nix path into double escaped win path', async () => {
      let nixPath = 'C:/foo/bar.exe'

      expect(windowsHelper.doubleEscape(nixPath)).toEqual(winPath)
    })

    it('converts win path with different backslash combination into double escaped win path', async () => {
      let badWinPath = 'C:\\\\\\\\\\foo\\bar.exe'

      expect(windowsHelper.doubleEscape(badWinPath)).toEqual(winPath)
    })

    it('converts single escaped win path into double escaped win path', async () => {
      let badWinPath = 'C:\\foo\\bar.exe'

      expect(windowsHelper.doubleEscape(badWinPath)).toEqual(winPath)
    })

    it('does not affect an already double escaped win path', async () => {
      let badWinPath = 'C:\\\\foo\\\\bar.exe'

      expect(windowsHelper.doubleEscape(badWinPath)).toEqual(badWinPath)
    })
  })
})
