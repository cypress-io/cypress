import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import globby from 'globby'
import { createTestDataContext } from '../helper'
import { ProjectConfigManager } from '../../../src/data/ProjectConfigManager'
import { EventRegistrar } from '../../../src/data/EventRegistrar'

vi.mock('globby', async (importOriginal) => {
  const { default: actualGlobby } = await importOriginal<typeof import('globby')>()

  return { default: vi.fn(actualGlobby) }
})

let configManager: ProjectConfigManager
let eventRegistrar: EventRegistrar

describe('ProjectConfigManager', () => {
  beforeEach(() => {
    const ctx = createTestDataContext('open')

    eventRegistrar = new EventRegistrar()

    configManager = new ProjectConfigManager({
      ctx,
      configFile: false,
      projectRoot: 'test/root',
      handlers: [],
      hasCypressEnvFile: false,
      eventRegistrar,
      onError: (error) => {},
      onInitialConfigLoaded: () => {},
      onFinalConfigLoaded: () => Promise.resolve(),
      refreshLifecycle: () => Promise.resolve(),
    })
  })

  afterEach(() => {
    delete process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT
  })

  describe('#mainProcessWillDisconnect', () => {
    it('rejects with an error when there is no IPC', async () => {
      await expect(configManager.mainProcessWillDisconnect()).rejects.toThrow('mainProcessWillDisconnect has no IPC available')
    })

    it('resolves immediately when the child process is already gone', async () => {
      // send() reports false for a killed or disconnected child; its exit/disconnect events have
      // already fired, so waiting on them would stall for the full timeout
      const configManagerInternals = configManager as any

      configManagerInternals._eventsIpc = {
        expectExit: () => {},
        send: () => false,
        on: () => {
          throw new Error('should not wait on a child that is already gone')
        },
      }

      const started = Date.now()

      await expect(configManager.mainProcessWillDisconnect()).resolves.toBeUndefined()

      // generous, but far below the 2s it would take if this waited on the dead child
      expect(Date.now() - started).toBeLessThan(500)
    })

    it('gives up well before the process teardown budget expires', async () => {
      process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '2000'

      const configManagerInternals = configManager as any

      // never acks, so the promise can only settle via its own timeout
      configManagerInternals._eventsIpc = {
        expectExit: () => {},
        send: () => true,
        on: () => {},
      }

      const started = Date.now()

      await expect(configManager.mainProcessWillDisconnect()).rejects.toThrow('timed out')

      expect(Date.now() - started).toBeLessThan(2000)
    })
  })

  describe('#destroy', () => {
    it('unregisters plugin events bound to the ipc it kills', async () => {
      const configManagerInternals = configManager as any
      let cleanedUp = false

      configManagerInternals._eventsIpc = {
        cleanupIpc: () => {
          cleanedUp = true
        },
      }

      eventRegistrar.registerEvent('after:run', () => {})

      expect(eventRegistrar.hasNodeEvent('after:run')).toBe(true)

      await configManager.destroy()

      expect(cleanedUp).toBe(true)
      expect(eventRegistrar.hasNodeEvent('after:run')).toBe(false)
      // the killed ipc must not be reachable afterwards
      expect(configManager.eventProcessPid).toBeUndefined()
    })

    it('does not throw when there is no ipc', async () => {
      eventRegistrar.registerEvent('after:run', () => {})

      await expect(configManager.destroy()).resolves.toBeUndefined()

      expect(eventRegistrar.hasNodeEvent('after:run')).toBe(false)
    })
  })

  describe('#eventProcessPid', () => {
    it('returns process id from events ipc', () => {
      // @ts-expect-error - a partial `ProjectConfigIpc` stub on the private `_eventsIpc`
      configManager._eventsIpc = {
        childProcessPid: 45699,
      }

      expect(configManager.eventProcessPid).toEqual(45699)
    })

    it('does not throw if config manager is not initialized', () => {
      // @ts-expect-error - `_eventsIpc` is private
      configManager._eventsIpc = undefined
      expect(configManager.eventProcessPid).toEqual(undefined)
    })
  })

  describe('#getFullInitialConfig', () => {
    let projectRoot: string
    let originalCypressInternalEnv: string | undefined

    beforeEach(async () => {
      originalCypressInternalEnv = process.env.CYPRESS_INTERNAL_ENV
      process.env.CYPRESS_INTERNAL_ENV = 'test'
      projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'project-config-manager-'))
      await fs.outputFile(path.join(projectRoot, 'cypress', 'support', 'e2e.js'), '')
    })

    afterEach(async () => {
      if (originalCypressInternalEnv === undefined) {
        delete process.env.CYPRESS_INTERNAL_ENV
      } else {
        process.env.CYPRESS_INTERNAL_ENV = originalCypressInternalEnv
      }

      vi.restoreAllMocks()
      await fs.remove(projectRoot)
    })

    it('finds the support file when the first glob search fails with a filesystem error', async () => {
      const ctx = createTestDataContext('open')
      const supportFile = path.join(projectRoot, 'cypress', 'support', 'e2e.js')

      const projectConfigManager = new ProjectConfigManager({
        ctx,
        configFile: 'cypress.config.js',
        projectRoot,
        handlers: [],
        hasCypressEnvFile: false,
        eventRegistrar,
        onError: (error) => {},
        onInitialConfigLoaded: () => {},
        onFinalConfigLoaded: () => Promise.resolve(),
        refreshLifecycle: () => Promise.resolve(),
      })

      projectConfigManager.configFilePath = path.join(projectRoot, 'cypress.config.js')
      projectConfigManager.setTestingType('e2e')
      vi.spyOn(projectConfigManager, 'getConfigFileContents').mockResolvedValue({ e2e: { supportFile: 'cypress/support/**/e2e.js' } })
      vi.spyOn(projectConfigManager, 'reloadCypressEnvFile').mockResolvedValue({})

      // globby rejects like this when a `**` support file pattern walks into a directory it cannot read
      const unreadableDir = path.join(projectRoot, 'cypress', 'support', 'private')
      const eaccesError = Object.assign(new Error(`EACCES: permission denied, scandir '${unreadableDir}'`), {
        errno: -13,
        code: 'EACCES',
        syscall: 'scandir',
        path: unreadableDir,
      })

      vi.mocked(globby)
      .mockRejectedValueOnce(eaccesError)
      .mockResolvedValueOnce([supportFile])

      const config = await projectConfigManager.getFullInitialConfig({}, false)

      expect(config.supportFile).toEqual(supportFile)
      expect(globby).toHaveBeenCalledTimes(2)
      expect(globby).toHaveBeenNthCalledWith(2, expect.any(Array), expect.objectContaining({ suppressErrors: true }))
    })
  })
})
