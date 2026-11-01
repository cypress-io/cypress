import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { createTestDataContext } from '../helper'
import type { FoundBrowser, FullConfig } from '@packages/types'

const browsers = [
  { name: 'electron', family: 'chromium', channel: 'stable', displayName: 'Electron', path: '', version: '' },
  { name: 'chrome', family: 'chromium', channel: 'stable', displayName: 'Chrome', path: '', version: '' },
  { name: 'chrome', family: 'chromium', channel: 'beta', displayName: 'Chrome Beta', path: '', version: '' },
  { name: 'firefox', family: 'firefox', channel: 'stable', displayName: 'Firefox', path: '', version: '' },
]

let ctx: DataContext

function createDataContext (modeOptions?: Parameters<typeof createTestDataContext>[1], mode: Parameters<typeof createTestDataContext>[0] = 'open') {
  const context = createTestDataContext(mode, modeOptions)

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

  describe('#onLoadError', () => {
    const loadErrorCtx = () => {
      const context = createDataContext({ project: 'foo' })
      const setSessionLoadError = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)

      context._apis.projectApi.setSessionLoadError = setSessionLoadError as any
      context.coreData.currentProject = '/projects/foo'
      jest.spyOn(context, 'onError').mockImplementation(() => {})

      return { context, setSessionLoadError }
    }

    it('records an error that stops the project for cypress tap status', () => {
      const { context, setSessionLoadError } = loadErrorCtx()

      context.lifecycleManager.onLoadError(new Error('boom') as any)

      expect(setSessionLoadError).toHaveBeenCalledTimes(1)
    })

    it('does not record an error that leaves the project running', () => {
      const { context, setSessionLoadError } = loadErrorCtx()

      context.lifecycleManager.onLoadError(new Error('both config files') as any, { stopsProject: false })

      expect(context.onError).toHaveBeenCalledTimes(1)
      expect(setSessionLoadError).not.toHaveBeenCalled()
    })
  })

  describe('#initializeProjectSetup', () => {
    const originalEnv = process.env
    let consoleError: ReturnType<typeof jest.spyOn>

    const scaffolded = (...statuses: Array<'valid' | 'changes' | 'skipped' | 'error'>) => {
      return statuses.map((status, index) => ({ status, description: '', file: { absolute: `/projects/foo/file-${index}.js`, contents: '' } }))
    }

    const setupCtx = (files: ReturnType<typeof scaffolded>, modeOptions: Parameters<typeof createDataContext>[0] = { project: 'foo', testingType: 'e2e' }, mode: Parameters<typeof createDataContext>[1] = 'open') => {
      const setup = createDataContext(modeOptions, mode)

      jest.spyOn(setup.lifecycleManager, 'isTestingTypeConfigured').mockReturnValue(false)
      jest.spyOn(setup.actions.wizard, 'completeSetup').mockResolvedValue(undefined)
      jest.spyOn(setup.actions.wizard, 'detectFrameworks').mockResolvedValue(undefined)
      jest.spyOn(setup.actions.wizard, 'initialize').mockResolvedValue(undefined)
      jest.spyOn(setup.actions.wizard, 'scaffoldTestingType').mockImplementation(async () => {
        setup.coreData.scaffoldedFiles = files
      })

      return setup
    }

    beforeEach(() => {
      process.env = { PATH: originalEnv.PATH }
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      process.env = originalEnv
      consoleError.mockRestore()
    })

    it('completes the setup after the e2e scaffold when an agent opens a project', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('valid', 'valid', 'skipped'))

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.scaffoldTestingType).toHaveBeenCalledTimes(1)
      expect(setup.actions.wizard.completeSetup).toHaveBeenCalledTimes(1)

      const scaffoldOrder = (setup.actions.wizard.scaffoldTestingType as jest.Mock).mock.invocationCallOrder[0]
      const completeOrder = (setup.actions.wizard.completeSetup as jest.Mock).mock.invocationCallOrder[0]

      expect(scaffoldOrder).toBeLessThan(completeOrder)
    })

    it('tells the agent which files it created', async () => {
      process.env.CLAUDECODE = '1'

      await setupCtx(scaffolded('valid', 'skipped', 'valid')).lifecycleManager.initializeProjectSetup('e2e')

      const printed = consoleError.mock.calls.map((args) => args.join(' ')).join('\n')

      expect(printed).toContain(path.relative('foo', '/projects/foo/file-0.js'))
      expect(printed).toContain(path.relative('foo', '/projects/foo/file-2.js'))
      expect(printed).not.toContain('file-1.js')
    })

    it('completes the setup when CYPRESS_AGENT_MODE forces agent mode on', async () => {
      process.env.CYPRESS_AGENT_MODE = '1'

      const setup = setupCtx(scaffolded('valid'))

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.completeSetup).toHaveBeenCalledTimes(1)
    })

    it('leaves the Continue step to a person when no agent is detected', async () => {
      const setup = setupCtx(scaffolded('valid'))

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.scaffoldTestingType).toHaveBeenCalledTimes(1)
      expect(setup.actions.wizard.completeSetup).not.toHaveBeenCalled()
    })

    it('leaves the Continue step to a person when CYPRESS_AGENT_MODE forces agent mode off', async () => {
      process.env.CLAUDECODE = '1'
      process.env.CYPRESS_AGENT_MODE = '0'

      const setup = setupCtx(scaffolded('valid'))

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.completeSetup).not.toHaveBeenCalled()
    })

    it('does not continue without --project', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('valid'), { testingType: 'e2e' })

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.completeSetup).not.toHaveBeenCalled()
    })

    it('does not continue when a scaffolded file needs changes merged by a person, and says which', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('valid', 'changes'))

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.completeSetup).not.toHaveBeenCalled()

      const printed = consoleError.mock.calls.map((args) => args.join(' ')).join('\n')

      expect(printed).toContain('could not finish setting up e2e testing')
      expect(printed).toContain(path.relative('foo', '/projects/foo/file-1.js'))
      expect(printed).not.toContain('file-0.js')
    })

    it('reports a config that fails to load after the scaffold instead of rejecting', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('valid'))
      const failure = new Error('Cannot find module cypress')

      jest.spyOn(setup.actions.wizard, 'completeSetup').mockRejectedValue(failure)

      const onLoadError = jest.spyOn(setup.lifecycleManager, 'onLoadError').mockImplementation(() => {})

      await expect(setup.lifecycleManager.initializeProjectSetup('e2e')).resolves.toBeUndefined()

      expect(onLoadError).toHaveBeenCalledWith(failure)
    })

    it('records the reason for cypress tap status when a file needs changes made by a person', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('valid', 'changes'))
      const setSessionLoadError = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)

      setup._apis.projectApi.setSessionLoadError = setSessionLoadError as any
      setup.coreData.currentProject = '/projects/foo'

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setSessionLoadError).toHaveBeenCalledWith(expect.objectContaining({
        loadError: expect.stringContaining('need changes made by hand'),
      }))
    })

    it('says nothing about created files when every file was skipped', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('skipped', 'skipped'))

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.completeSetup).toHaveBeenCalledTimes(1)
      expect(consoleError).not.toHaveBeenCalled()
    })

    it('does not continue when a scaffolded file errored', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('error'))

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.completeSetup).not.toHaveBeenCalled()
    })

    it('does not continue for component testing, which needs a framework and bundler chosen', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('valid'), { project: 'foo', testingType: 'component' })

      await setup.lifecycleManager.initializeProjectSetup('component')

      expect(setup.actions.wizard.scaffoldTestingType).not.toHaveBeenCalled()
      expect(setup.actions.wizard.completeSetup).not.toHaveBeenCalled()
    })

    it('does nothing when the testing type is already configured', async () => {
      process.env.CLAUDECODE = '1'

      const setup = setupCtx(scaffolded('valid'))

      jest.spyOn(setup.lifecycleManager, 'isTestingTypeConfigured').mockReturnValue(true)

      await setup.lifecycleManager.initializeProjectSetup('e2e')

      expect(setup.actions.wizard.scaffoldTestingType).not.toHaveBeenCalled()
      expect(setup.actions.wizard.completeSetup).not.toHaveBeenCalled()
    })
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

    describe('when the welcome screen has not been dismissed', () => {
      const originalEnv = process.env

      const agentCtx = (modeOptions: Parameters<typeof createDataContext>[0] = { project: 'foo', testingType: 'e2e', browser: 'electron', isBrowserGivenByCli: true }) => {
        const agent = createDataContext(modeOptions)

        jest.spyOn(agent.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
        jest.spyOn(agent._apis.localSettingsApi, 'getPreferences').mockResolvedValue({})
        jest.spyOn(agent._apis.browserApi, 'ensureAndGetByNameOrPath').mockResolvedValue(browsers[0])
        agent.coreData.activeBrowser = null
        agent.coreData.cliBrowser = 'electron'

        return agent
      }

      beforeEach(() => {
        process.env = { PATH: originalEnv.PATH }
      })

      afterEach(() => {
        process.env = originalEnv
      })

      it('launches the project for an agent that gave --project, --testingType and --browser', async () => {
        process.env.CLAUDECODE = '1'

        const agent = agentCtx()

        await agent.lifecycleManager.setInitialActiveBrowser()

        expect(agent.actions.project.launchProject).toHaveBeenCalledTimes(1)
      })

      it('launches the project when CYPRESS_AGENT_MODE forces agent mode on', async () => {
        process.env.CYPRESS_AGENT_MODE = '1'

        const agent = agentCtx()

        await agent.lifecycleManager.setInitialActiveBrowser()

        expect(agent.actions.project.launchProject).toHaveBeenCalledTimes(1)
      })

      it('does not launch when the browser it was given cannot be found', async () => {
        process.env.CLAUDECODE = '1'

        const agent = agentCtx()

        jest.spyOn(agent._apis.browserApi, 'ensureAndGetByNameOrPath').mockRejectedValue(new Error('Browser not found'))
        jest.spyOn(agent.project, 'getProjectPreferences').mockResolvedValue(null)

        await agent.lifecycleManager.setInitialActiveBrowser()

        expect(agent.actions.project.launchProject).not.toHaveBeenCalled()
      })

      it('waits for the person to dismiss it when no agent is detected', async () => {
        const person = agentCtx()

        await person.lifecycleManager.setInitialActiveBrowser()

        expect(person.actions.project.launchProject).not.toHaveBeenCalled()
      })

      it('waits for the person to dismiss it when CYPRESS_AGENT_MODE forces agent mode off', async () => {
        process.env.CLAUDECODE = '1'
        process.env.CYPRESS_AGENT_MODE = '0'

        const person = agentCtx()

        await person.lifecycleManager.setInitialActiveBrowser()

        expect(person.actions.project.launchProject).not.toHaveBeenCalled()
      })

      it('applies when the browser comes from defaultBrowser in the config, which stands in for --browser', async () => {
        process.env.CLAUDECODE = '1'

        const agent = agentCtx({ project: 'foo', testingType: 'e2e', isBrowserGivenByCli: false })

        agent.coreData.cliBrowser = null

        jest.spyOn(agent.lifecycleManager, 'loadedFullConfig', 'get').mockReturnValue({ defaultBrowser: 'electron' } as unknown as FullConfig)

        await agent.lifecycleManager.setInitialActiveBrowser()

        expect(agent.actions.project.launchProject).toHaveBeenCalledTimes(1)
      })

      it('applies to a defaultBrowser in the config file before setupNodeEvents finishes', () => {
        process.env.CLAUDECODE = '1'

        const agent = agentCtx({ project: 'foo', testingType: 'e2e', isBrowserGivenByCli: false })

        jest.spyOn(agent.lifecycleManager, 'loadedConfigFile', 'get').mockReturnValue({ defaultBrowser: 'electron' })

        expect(agent.lifecycleManager.loadedFullConfig).toBeNull()
        expect(agent.lifecycleManager.isWelcomeBypassedForAgent).toBe(true)
      })

      it('applies to a defaultBrowser in the config file\'s testing type before setupNodeEvents finishes', () => {
        process.env.CLAUDECODE = '1'

        const agent = agentCtx({ project: 'foo', testingType: 'e2e', isBrowserGivenByCli: false })

        jest.spyOn(agent.lifecycleManager, 'loadedConfigFile', 'get').mockReturnValue({ e2e: { defaultBrowser: 'electron' } })

        expect(agent.lifecycleManager.isWelcomeBypassedForAgent).toBe(true)
      })

      it('follows the full config once it exists, even when setupNodeEvents removed the defaultBrowser', () => {
        process.env.CLAUDECODE = '1'

        const agent = agentCtx({ project: 'foo', testingType: 'e2e', isBrowserGivenByCli: false })

        jest.spyOn(agent.lifecycleManager, 'loadedConfigFile', 'get').mockReturnValue({ defaultBrowser: 'electron' })
        jest.spyOn(agent.lifecycleManager, 'loadedFullConfig', 'get').mockReturnValue({ defaultBrowser: null } as unknown as FullConfig)

        expect(agent.lifecycleManager.isWelcomeBypassedForAgent).toBe(false)
      })

      it('is not bypassed without --testingType', () => {
        process.env.CLAUDECODE = '1'

        expect(agentCtx({ project: 'foo' }).lifecycleManager.isWelcomeBypassedForAgent).toBe(false)
      })

      it('is not bypassed without --browser or a defaultBrowser', () => {
        process.env.CLAUDECODE = '1'

        const agent = agentCtx({ project: 'foo', testingType: 'e2e' })

        expect(agent.lifecycleManager.isWelcomeBypassedForAgent).toBe(false)
      })

      it('is not bypassed by a browser that a config reload copied into cliBrowser', async () => {
        process.env.CLAUDECODE = '1'

        const agent = agentCtx({ project: 'foo', testingType: 'e2e' })

        agent.coreData.cliBrowser = null

        // the first load has no browser to launch, so one is chosen without launching it
        await agent.lifecycleManager.setInitialActiveBrowser()

        expect(agent.coreData.activeBrowser).not.toBeNull()

        // a reload then copies the active browser into cliBrowser
        await agent.lifecycleManager.setInitialActiveBrowser()

        expect(agent.coreData.cliBrowser).not.toBeNull()
        expect(agent.lifecycleManager.isWelcomeBypassedForAgent).toBe(false)
        expect(agent.actions.project.launchProject).not.toHaveBeenCalled()
      })

      it('is not bypassed in run mode', () => {
        process.env.CLAUDECODE = '1'

        const runCtx = createDataContext({ project: 'foo', testingType: 'e2e' }, 'run')

        runCtx.coreData.cliBrowser = 'electron'

        expect(runCtx.lifecycleManager.isWelcomeBypassedForAgent).toBe(false)
      })
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

    describe('in run mode', () => {
      it('uses lastBrowser without writing it back to the cache', async () => {
        ctx = createDataContext({}, 'run')
        jest.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
        jest.spyOn(ctx.project, 'getProjectPreferences').mockResolvedValue({ lastBrowser: { name: 'chrome', channel: 'beta' } })

        await ctx.lifecycleManager.setInitialActiveBrowser()

        expect(ctx.coreData.activeBrowser).toEqual(expect.objectContaining({ name: 'chrome', displayName: 'Chrome Beta' }))
        expect(ctx._apis.projectApi.insertProjectPreferencesToCache).not.toHaveBeenCalled()
      })

      it('uses the --browser option without writing it to the cache', async () => {
        ctx = createDataContext({
          project: 'foo',
          testingType: 'e2e',
          browser: 'firefox',
          isBrowserGivenByCli: true,
        }, 'run')

        jest.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockResolvedValue(fullConfig)
        jest.spyOn(ctx._apis.browserApi, 'ensureAndGetByNameOrPath').mockResolvedValue(browsers[3])

        await ctx.lifecycleManager.setInitialActiveBrowser()

        expect(ctx.coreData.activeBrowser).toEqual(browsers[3])
        expect(ctx._apis.projectApi.insertProjectPreferencesToCache).not.toHaveBeenCalled()
      })
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
