import execa from 'execa'
import _ from 'lodash'
import os from 'os'

import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

let isPowerShellAvailable: undefined | boolean
let powerShellPromise: Promise<void> | undefined

// Only need to worry about checking for PowerShell in windows,
// doing it asynchronously so to not block startup
if (os.platform() === 'win32') {
  powerShellPromise = execa(`[void] ''`, { shell: 'powershell' }).then(() => {
    isPowerShellAvailable = true
  }).catch(() => {
    // Powershell is unavailable
    isPowerShellAvailable = false
  }).finally(() => {
    powerShellPromise = undefined
  })
}

const platform = os.platform()

function getBrowserKey<T extends {name: string, version: string | number}> (browser: T) {
  return `${browser.name}-${browser.version}`
}

export function removeDuplicateBrowsers (browsers: FoundBrowser[]) {
  return _.uniqBy(browsers, getBrowserKey)
}

export interface BrowserApiShape {
  close(): Promise<any>
  ensureAndGetByNameOrPath(nameOrPath: string): Promise<FoundBrowser>
  getBrowsers(): Promise<FoundBrowser[]>
  focusActiveBrowserWindow(): Promise<any>
  relaunchBrowser(): Promise<void> | null
}

export class BrowserDataSource {
  constructor (private ctx: DataContext) {}

  /**
   * Gets the browsers from the machine and the project config
   */
  async allBrowsers () {
    if (this.ctx.coreData.allBrowsers) {
      return this.ctx.coreData.allBrowsers
    }

    const p = await this.ctx.project.getConfig()
    const machineBrowsers = await this.machineBrowsers()

    if (!p.browsers) {
      this.ctx.coreData.allBrowsers = Promise.resolve(machineBrowsers)

      return this.ctx.coreData.allBrowsers
    }

    const userBrowsers = p.browsers.reduce<FoundBrowser[]>((acc, b) => {
      if (_.includes(_.map(machineBrowsers, getBrowserKey), getBrowserKey(b))) return acc

      return [...acc, {
        ...b,
        majorVersion: String(b.majorVersion),
        custom: true,
      }]
    }, [])

    this.ctx.coreData.allBrowsers = Promise.resolve(_.concat(machineBrowsers, userBrowsers))

    return this.ctx.coreData.allBrowsers
  }

  /**
   * Gets the browsers from the machine, caching the Promise on the coreData
   * so we only look them up once
   */
  machineBrowsers () {
    if (this.ctx.coreData.machineBrowsers) {
      return this.ctx.coreData.machineBrowsers
    }

    const p = this.ctx._apis.browserApi.getBrowsers()

    return this.ctx.coreData.machineBrowsers = p.then(async (browsers) => {
      if (!browsers[0]) throw new Error('no browsers found in machineBrowsers')

      return browsers
    }).catch((e) => {
      this.ctx.update((coreData) => {
        coreData.machineBrowsers = null
        coreData.diagnostics.error = e
      })

      throw e
    })
  }

  idForBrowser (obj: FoundBrowser) {
    return `${obj.name}-${obj.family}-${obj.channel}`
  }

  isSelected (obj: FoundBrowser) {
    if (!this.ctx.coreData.activeBrowser) {
      return false
    }

    return this.idForBrowser(this.ctx.coreData.activeBrowser) === this.idForBrowser(obj)
  }

  async isFocusSupported (obj: FoundBrowser) {
    if (obj.family !== 'firefox') {
      return true
    }

    // Only allow focusing if PowerShell is available on Windows, since that's what we use to do it
    if (platform === 'win32') {
      if (powerShellPromise) {
        await powerShellPromise
      }

      return isPowerShellAvailable ?? false
    }

    return false
  }

  isVersionSupported (obj: FoundBrowser) {
    return Boolean(!obj.unsupportedVersion)
  }
}
