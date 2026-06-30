import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import fs from 'fs-extra'
import os from 'os'
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

    it('returns early without throwing if the project was cleared mid-setup', async () => {
      // Simulates the user clearing the project (e.g. clicking "back to projects"
      // or switching projects) while setupNodeEvents is still in flight.
      // @ts-expect-error - private field
      ctx.lifecycleManager._projectRoot = undefined
      ctx.coreData.activeBrowser = null
      ctx.coreData.cliBrowser = null

      await expect(ctx.lifecycleManager.setInitialActiveBrowser()).resolves.toBeUndefined()
      expect(ctx.coreData.activeBrowser).toBeNull()
    })
  })

  describe('onFinalConfigLoaded', () => {
    it('returns early without throwing if the project was cleared mid-setup', async () => {
      // Simulates the user clearing the project (e.g. clicking "back to projects"
      // or switching projects) while setupNodeEvents is still in flight.

      // Grab the onFinalConfigLoaded callback the way the ProjectConfigManager
      // would when it finishes resolving setupNodeEvents.
      // @ts-expect-error - private method
      const configManager = ctx.lifecycleManager.createConfigManager()
      const onFinalConfigLoaded = (configManager as any).options.onFinalConfigLoaded as (config: FullConfig, options: { shouldRestartBrowser: boolean }) => Promise<void>

      const setSpecsSpy = jest.spyOn(ctx.actions.project, 'setSpecsFoundBySpecPattern').mockResolvedValue(undefined)
      const setInitialActiveBrowserSpy = jest.spyOn(ctx.lifecycleManager, 'setInitialActiveBrowser').mockResolvedValue(undefined)

      // @ts-expect-error - private field
      ctx.lifecycleManager._projectRoot = undefined

      await expect(onFinalConfigLoaded(fullConfig, { shouldRestartBrowser: false })).resolves.toBeUndefined()

      expect(setSpecsSpy).not.toHaveBeenCalled()
      expect(setInitialActiveBrowserSpy).not.toHaveBeenCalled()
      // @ts-expect-error - private field
      expect(ctx.lifecycleManager._cachedFullConfig).toBeUndefined()
    })
  })

  describe('#getPackageManagerUsed', () => {
    let tmpDir: string

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cy-plm-pm-'))
    })

    afterEach(async () => {
      await fs.remove(tmpDir).catch(() => {})
    })

    it('detects bun when bun.lockb is present (legacy Bun binary lockfile)', () => {
      fs.writeFileSync(path.join(tmpDir, 'bun.lockb'), Buffer.alloc(0))

      // @ts-expect-error — private method
      expect(ctx.lifecycleManager.getPackageManagerUsed(tmpDir)).toEqual('bun')
    })

    it('detects bun when bun.lock is present', () => {
      fs.writeFileSync(path.join(tmpDir, 'bun.lock'), '{}')

      // @ts-expect-error — private method
      expect(ctx.lifecycleManager.getPackageManagerUsed(tmpDir)).toEqual('bun')
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

  describe('#getProjectId', () => {
    it('returns null without loading the config when the project has no config file', async () => {
      // @ts-expect-error - private field
      ctx.lifecycleManager._projectMetaState = { hasValidConfigFile: false }

      const getConfigSpy = jest.spyOn(ctx.project, 'getConfig')

      await expect(ctx.lifecycleManager.getProjectId()).resolves.toBeNull()
      expect(getConfigSpy).not.toHaveBeenCalled()
    })

    it('loads the config and returns the projectId when a valid config file exists', async () => {
      // @ts-expect-error - private field
      ctx.lifecycleManager._projectMetaState = { hasValidConfigFile: true }

      const getConfigSpy = jest.spyOn(ctx.project, 'getConfig').mockResolvedValue({ projectId: 'abc123' } as FullConfig)

      await expect(ctx.lifecycleManager.getProjectId()).resolves.toEqual('abc123')
      expect(getConfigSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('#refreshLifecycle', () => {
    type Deferred = { promise: Promise<void>, resolve: () => void, reject: (err: Error) => void }

    function deferred (): Deferred {
      let resolve!: () => void
      let reject!: (err: Error) => void
      const promise = new Promise<void>((res, rej) => {
        resolve = res
        reject = rej
      })

      return { promise, resolve, reject }
    }

    function setupReady () {
      // @ts-expect-error - private field
      ctx.lifecycleManager._configManager = { destroy: () => {} }
      // @ts-expect-error - private method
      jest.spyOn(ctx.lifecycleManager, 'readyToInitialize').mockReturnValue(true)
    }

    it('skips when the project is not ready to initialize', async () => {
      const spy = jest.spyOn(ctx.lifecycleManager as any, '_doRefreshLifecycle').mockResolvedValue(undefined)

      // _projectRoot is set in createDataContext, but _configManager is undefined
      // and readyToInitialize will be false in this state
      await ctx.lifecycleManager.refreshLifecycle()

      expect(spy).not.toHaveBeenCalled()
    })

    it('runs the refresh exactly once for a single call', async () => {
      setupReady()
      const spy = jest.spyOn(ctx.lifecycleManager as any, '_doRefreshLifecycle').mockResolvedValue(undefined)

      await ctx.lifecycleManager.refreshLifecycle()

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('coalesces concurrent calls into a single re-run after the in-flight refresh', async () => {
      setupReady()

      const first = deferred()
      const second = deferred()
      const calls: Array<Deferred> = [first, second]

      const spy = jest.spyOn(ctx.lifecycleManager as any, '_doRefreshLifecycle')
      .mockImplementation(() => calls.shift()?.promise ?? Promise.resolve())

      // First call kicks off the refresh
      const a = ctx.lifecycleManager.refreshLifecycle()

      // Two more calls arrive while the first is still in flight — they should
      // queue exactly one extra iteration, not two
      const b = ctx.lifecycleManager.refreshLifecycle()
      const c = ctx.lifecycleManager.refreshLifecycle()

      expect(spy).toHaveBeenCalledTimes(1)

      first.resolve()
      // Yield so the do/while loop can pick up the queued flag and start the
      // second iteration before we assert on the call count
      await Promise.resolve()
      await Promise.resolve()

      expect(spy).toHaveBeenCalledTimes(2)

      second.resolve()
      await Promise.all([a, b, c])

      // Only one extra run, even though two concurrent calls came in
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('makes awaited callers wait for the queued iteration to finish, not just the in-flight one', async () => {
      setupReady()

      const first = deferred()
      const second = deferred()
      const calls = [first, second]
      const resolved: string[] = []

      jest.spyOn(ctx.lifecycleManager as any, '_doRefreshLifecycle')
      .mockImplementation(() => calls.shift()?.promise ?? Promise.resolve())

      const a = ctx.lifecycleManager.refreshLifecycle().then(() => resolved.push('a'))
      const b = ctx.lifecycleManager.refreshLifecycle().then(() => resolved.push('b'))

      // Resolve only the first iteration. `b` was queued during `a`, so it
      // should still be pending until the second iteration finishes too.
      first.resolve()
      await Promise.resolve()
      await Promise.resolve()

      expect(resolved).toEqual([])

      second.resolve()
      await Promise.all([a, b])

      expect(resolved).toEqual(['a', 'b'])
    })

    it('serializes overlapping refreshes so initializeConfig never runs concurrently', async () => {
      // Regression for the race that surfaced as ERR_STREAM_DESTROYED on
      // packages/app/cypress/e2e/subscriptions/specChange-subscription.cy.ts:
      // when a watcher fired a second refresh while the first was still
      // running, both calls hit `initializeConfig` concurrently and corrupted
      // the shared IPC state. This test asserts that no two `initializeConfig`
      // calls are ever in flight at once.

      // @ts-expect-error - private field
      ctx.lifecycleManager._configManager = { destroy: () => {}, resetLoadingState: () => {} }
      // @ts-expect-error - private method
      jest.spyOn(ctx.lifecycleManager, 'readyToInitialize').mockReturnValue(true)
      ctx._apis.projectApi.getRemoteStates = (() => undefined) as any
      jest.spyOn(ctx.lifecycleManager, 'setAndLoadCurrentTestingType').mockImplementation(() => {})

      let inFlight = 0
      let maxInFlight = 0
      const gates = [deferred(), deferred()]
      let callIndex = 0

      jest.spyOn(ctx.lifecycleManager, 'initializeConfig').mockImplementation(async () => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await gates[callIndex++]?.promise
        inFlight--

        return {} as any
      })

      const a = ctx.lifecycleManager.refreshLifecycle()
      const b = ctx.lifecycleManager.refreshLifecycle()

      gates[0]!.resolve()
      await Promise.resolve()
      await Promise.resolve()

      gates[1]!.resolve()
      await Promise.all([a, b])

      expect(maxInFlight).toBe(1)
      expect(callIndex).toBe(2)
    })

    it('does not hand stale refresh promises to callers after a project switch', async () => {
      // If a project switch (resetInternalState) happens while a refresh is
      // in flight, the in-flight promise is doomed (its config manager is
      // about to be destroyed). The new project's first refresh must start a
      // fresh chain instead of latching onto the old promise.
      setupReady()

      const oldRefresh = deferred()
      const newRefresh = deferred()

      const spy = jest.spyOn(ctx.lifecycleManager as any, '_doRefreshLifecycle')
      .mockImplementationOnce(() => oldRefresh.promise)
      .mockImplementationOnce(() => newRefresh.promise)
      .mockImplementation(() => Promise.resolve())

      // First call kicks off the in-flight refresh on the old project
      const a = ctx.lifecycleManager.refreshLifecycle()

      // Project switch happens — must drop the in-flight reference so the
      // new project doesn't get handed the old (doomed) promise
      // @ts-expect-error - private method
      await ctx.lifecycleManager.resetInternalState()

      // Re-arm the project so the next refresh passes the readiness guard
      setupReady()

      // A new refresh on the (new) project starts a fresh chain — confirms
      // resetInternalState cleared `_activeLifecycleRefresh`
      const b = ctx.lifecycleManager.refreshLifecycle()

      expect(spy).toHaveBeenCalledTimes(2)

      // The old promise settles WHILE the new chain is still in flight. The
      // old IIFE's `finally` must not clobber the new chain's slot — if it
      // does, a follow-up call would skip the in-flight new chain and start
      // a third one, breaking serialization.
      oldRefresh.reject(new Error('config manager destroyed'))
      await a.catch(() => {})

      // The new chain is still in flight, so a follow-up call should reuse
      // it (no new `_doRefreshLifecycle` call). Without the ownership-check
      // guard, the old IIFE's finally would have nulled
      // `_activeLifecycleRefresh` and this call would synchronously kick
      // off a third chain.
      const c = ctx.lifecycleManager.refreshLifecycle()

      expect(spy).toHaveBeenCalledTimes(2)

      newRefresh.resolve()
      await Promise.all([b, c])
    })

    it('rejects all in-flight callers and clears state when a refresh throws', async () => {
      setupReady()

      const failing = deferred()
      const succeeding = deferred()

      const spy = jest.spyOn(ctx.lifecycleManager as any, '_doRefreshLifecycle')
      .mockImplementationOnce(() => failing.promise)
      .mockImplementationOnce(() => succeeding.promise)

      const a = ctx.lifecycleManager.refreshLifecycle()
      const b = ctx.lifecycleManager.refreshLifecycle()

      failing.reject(new Error('boom'))

      await expect(a).rejects.toThrow('boom')
      await expect(b).rejects.toThrow('boom')

      // After rejection, state should be cleared so the next call kicks off
      // a fresh chain rather than re-throwing the previous error.
      const c = ctx.lifecycleManager.refreshLifecycle()

      succeeding.resolve()
      await c

      expect(spy).toHaveBeenCalledTimes(2)
    })
  })
})
