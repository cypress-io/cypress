import fs from 'fs-extra'
import path from 'path'
import Debug from 'debug'
import { notInstalledErr } from './errors'

import type { Browser, FoundBrowser } from '@packages/types'

const debug = Debug('cypress:launcher:detect:webkit')

const getWebKitBrowserVersion = async (versionRex) => {
  try {
    // this seems to be the only way to accurately capture the WebKit version - it's not exported, and invoking the webkit binary with `--version` does not give the correct result
    // after launching the browser, this is available at browser.version(), but we don't have a browser instance til later
    const pwCorePath = path.dirname(require.resolve('playwright-core', { paths: [process.cwd()] }))
    const wkBrowserPath = path.join(pwCorePath, 'lib', 'server', 'webkit', 'wkBrowser.js')
    const wkBrowserContents = await fs.readFile(wkBrowserPath, 'utf8')
    const result = versionRex.exec(wkBrowserContents)

    if (!result || !result.groups!.version) return '0'

    return result.groups!.version
  } catch (err) {
    debug('Error detecting WebKit browser version %o', err)

    return '0'
  }
}

export async function detectWebkit (browser: Browser): Promise<FoundBrowser> {
  try {
    const modulePath = require.resolve(browser.binary as string, { paths: [process.cwd()] })
    const [mod, version] = await Promise.all([
      require(modulePath),
      getWebKitBrowserVersion(browser.versionRegex),
    ])

    const foundBrowser: FoundBrowser = {
      name: 'webkit',
      family: 'webkit',
      channel: 'stable',
      displayName: 'WebKit',
      version,
      path: mod.webkit.executablePath(),
      majorVersion: version.split('.')[0],
      warning: 'WebKit support is currently experimental. Some functions may not work as expected.',
    }

    return foundBrowser
  } catch (err) {
    debug('There was an error detecting the WebKit browser: %o', { err })

    throw notInstalledErr('webkit', 'Error detecting playwright-webkit')
  }
}
