import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import { createTestDataContext } from '../helper'
import { ProjectConfigManager } from '../../../src/data/ProjectConfigManager'
import { EventRegistrar } from '../../../src/data/EventRegistrar'

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
      // @ts-expect-error
      configManager._eventsIpc = {
        childProcessPid: 45699,
      }

      expect(configManager.eventProcessPid).toEqual(45699)
    })

    it('does not throw if config manager is not initialized', () => {
      // @ts-expect-error
      configManager._eventsIpc = undefined
      expect(configManager.eventProcessPid).toEqual(undefined)
    })
  })
})
