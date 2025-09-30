import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import path from 'path'
import { createTestDataContext } from '../helper'
import { FoundBrowser, FullConfig } from '@packages/types'

const browsers = [
  { name: 'electron', family: 'chromium', channel: 'stable', displayName: 'Electron', path: '', version: '' },
  { name: 'chrome', family: 'chromium', channel: 'stable', displayName: 'Chrome', path: '', version: '' },
  { name: 'chrome', family: 'chromium', channel: 'beta', displayName: 'Chrome Beta', path: '', version: '' },
  { name: 'firefox', family: 'firefox', channel: 'stable', displayName: 'Firefox', path: '', version: '' },
]

let ctx: DataContext

function createDataContext (modeOptions?: Parameters<typeof createTestDataContext>[1]) {
  const context = createTestDataContext('open', modeOptions)

  jest.spyOn(context._apis.browserApi, 'getBrowsers').mockResolvedValue(browsers)
  context._apis.projectApi.insertProjectPreferencesToCache = jest.fn()
  jest.spyOn(context.actions.project, 'launchProject').mockResolvedValue(undefined)
  jest.spyOn(context.project, 'getProjectPreferences').mockResolvedValue(null)

  // @ts-expect-error
  context.lifecycleManager._projectRoot = 'foo'

  return context
}

const fullConfig: FullConfig = {
  resolved: {},
  browsers: [],
}

describe('ProjectLifecycleManager', () => {
  beforeEach(() => {
    ctx = createDataContext()
    jest.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
  })

  afterEach(() => {
    // reset the working directory to the root of @packages/data-context
    process.chdir(path.join(__dirname, '../../../'))
  })

  describe('#setInitialActiveBrowser', () => {
    it('falls back to browsers[0] if preferences and cliBrowser do not exist', async () => {
      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = null

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).toEqual(expect.objectContaining({ name: 'electron' }))
      expect(ctx.actions.project.launchProject).not.toHaveBeenCalled()
    })

    it('uses cli --browser option if one is set', async () => {
      jest.spyOn(ctx._apis.browserApi, 'ensureAndGetByNameOrPath').mockImplementation((name) => {
        if (name === 'electron') {
          return Promise.resolve(browsers[0])
        }

        throw new Error('Browser not found')
      })

      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = 'electron'

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.cliBrowser).toEqual('electron')
      expect(ctx.coreData.activeBrowser).toEqual(expect.objectContaining({ name: 'electron' }))
      expect(ctx.actions.project.launchProject).not.toHaveBeenCalled()
    })

    it('uses cli --browser option and launches project if `--project --testingType` were used', async () => {
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
      })

      jest.spyOn(ctx._apis.browserApi, 'ensureAndGetByNameOrPath').mockImplementation((name) => {
        if (name === 'electron') {
          return Promise.resolve(browsers[0])
        }

        throw new Error('Browser not found')
      })

      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = 'electron'

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.cliBrowser).toEqual('electron')
      expect(ctx.coreData.activeBrowser).toEqual(expect.objectContaining({ name: 'electron' }))
      expect(ctx.actions.project.launchProject).toHaveBeenCalledTimes(1)
    })

    it('uses lastBrowser if available', async () => {
      jest.spyOn(ctx.project, 'getProjectPreferences').mockResolvedValue({ lastBrowser: { name: 'chrome', channel: 'beta' } })
      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = null

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).toEqual(expect.objectContaining({ name: 'chrome', displayName: 'Chrome Beta' }))
      expect(ctx.actions.project.launchProject).not.toHaveBeenCalled()
    })

    it('falls back to browsers[0] if lastBrowser does not exist', async () => {
      jest.spyOn(ctx.project, 'getProjectPreferences').mockResolvedValue({ lastBrowser: { name: 'chrome', channel: 'dev' } })
      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = null

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.coreData.activeBrowser).toEqual(expect.objectContaining({ name: 'electron' }))
      expect(ctx.actions.project.launchProject).not.toHaveBeenCalled()
    })

    it('uses config defaultBrowser option if --browser is not given', async () => {
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
        isBrowserGivenByCli: false,
      })

      jest.spyOn(ctx._apis.browserApi, 'ensureAndGetByNameOrPath').mockImplementation((name) => {
        if (name === 'chrome') {
          return Promise.resolve(browsers[1])
        }

        throw new Error('Browser not found')
      })

      jest.spyOn(ctx.lifecycleManager, 'loadedFullConfig', 'get').mockReturnValue({ defaultBrowser: 'chrome' } as unknown as FullConfig)

      expect(ctx.modeOptions.browser).toEqual(undefined)
      expect(ctx.coreData.cliBrowser).toEqual(null)
      expect(ctx.coreData.activeBrowser).toEqual(null)

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.modeOptions.browser).toEqual('chrome')
      expect(ctx.coreData.cliBrowser).toEqual('chrome')
      expect(ctx.coreData.activeBrowser).toEqual(browsers[1])
    })

    it('doesn\'t use config defaultBrowser option if --browser is given', async () => {
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
        browser: 'firefox',
        isBrowserGivenByCli: true,
      })

      jest.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
      jest.spyOn(ctx._apis.browserApi, 'ensureAndGetByNameOrPath').mockImplementation((name) => {
        if (name === 'firefox') {
          return Promise.resolve(browsers[3])
        }

        throw new Error('Browser not found')
      })

      jest.spyOn(ctx.lifecycleManager, 'loadedFullConfig', 'get').mockReturnValue({ defaultBrowser: 'chrome' } as unknown as FullConfig)

      expect(ctx.modeOptions.browser).toEqual('firefox')
      expect(ctx.coreData.cliBrowser).toEqual('firefox')
      expect(ctx.coreData.activeBrowser).toEqual(null)

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.modeOptions.browser).toEqual('firefox')
      expect(ctx.coreData.cliBrowser).toEqual('firefox')
      expect(ctx.coreData.activeBrowser).toEqual(browsers[3])
    })

    it('ignores the defaultBrowser if there is an active browser and updates the CLI browser to the active browser', async () => {
      ctx = createDataContext({
        project: 'foo',
        testingType: 'e2e',
        isBrowserGivenByCli: false,
      })

      jest.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
      jest.spyOn(ctx._apis.browserApi, 'ensureAndGetByNameOrPath').mockImplementation((name) => {
        if (name === 'chrome:beta') {
          return Promise.resolve(browsers[2])
        }

        throw new Error('Browser not found')
      })

      // the default browser will be ignored since we have an active browser
      jest.spyOn(ctx.lifecycleManager, 'loadedFullConfig', 'get').mockReturnValue({ defaultBrowser: 'firefox' } as unknown as FullConfig)

      // set the active browser to chrome:beta
      ctx.actions.browser.setActiveBrowser(browsers[2] as FoundBrowser)

      expect(ctx.modeOptions.browser).toEqual(undefined)
      expect(ctx.coreData.cliBrowser).toBeNull()
      expect(ctx.coreData.activeBrowser).toEqual(browsers[2])

      await ctx.lifecycleManager.setInitialActiveBrowser()

      expect(ctx.modeOptions.browser).toEqual('chrome:beta')
      expect(ctx.coreData.cliBrowser).toEqual('chrome:beta')
      expect(ctx.coreData.activeBrowser).toEqual(browsers[2])
    })
  })

  describe('#eventProcessPid', () => {
    it('returns process id from config manager', () => {
      // @ts-expect-error
      ctx.lifecycleManager._configManager = {
        eventProcessPid: 12399,
        destroy: () => {},
      }

      expect(ctx.lifecycleManager.eventProcessPid).toEqual(12399)
    })

    it('does not throw if config manager is not initialized', () => {
      // @ts-expect-error
      ctx.lifecycleManager._configManager = undefined
      expect(ctx.lifecycleManager.eventProcessPid).toEqual(undefined)
    })
  })
})
