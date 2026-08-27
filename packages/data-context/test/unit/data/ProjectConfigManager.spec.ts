import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import { createTestDataContext } from '../helper'
import { ProjectConfigManager } from '../../../src/data/ProjectConfigManager'
import { EventRegistrar } from '../../../src/data/EventRegistrar'

let configManager: ProjectConfigManager

describe('ProjectConfigManager', () => {
  beforeEach(() => {
    const ctx = createTestDataContext('open')

    configManager = new ProjectConfigManager({
      ctx,
      configFile: false,
      projectRoot: 'test/root',
      handlers: [],
      hasCypressEnvFile: false,
      eventRegistrar: new EventRegistrar(),
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
