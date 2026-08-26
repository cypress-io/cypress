import { describe, expect, it, beforeEach, jest } from '@jest/globals'
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

  // Every path must resolve, since a rejection here fails a graceful-exit
  // teardown step and turns a passing `cypress run` into exit code 1.
  describe('#mainProcessWillDisconnect', () => {
    const stubEventsIpc = (send: () => boolean) => {
      const listeners: Record<string, () => void> = {}

      // @ts-expect-error
      configManager._eventsIpc = {
        send,
        on: (event: string, listener: () => void) => {
          listeners[event] = listener
        },
      }

      return listeners
    }

    it('resolves when there is no IPC', async () => {
      // @ts-expect-error
      configManager._eventsIpc = undefined

      await expect(configManager.mainProcessWillDisconnect()).resolves.toBeUndefined()
    })

    it('resolves when the child process is already gone', async () => {
      stubEventsIpc(() => false)

      await expect(configManager.mainProcessWillDisconnect()).resolves.toBeUndefined()
    })

    it('resolves when the child process acks', async () => {
      const listeners = stubEventsIpc(() => true)
      const promise = configManager.mainProcessWillDisconnect()

      listeners['main:process:will:disconnect:ack']()

      await expect(promise).resolves.toBeUndefined()
    })

    it('resolves when the ack times out', async () => {
      jest.useFakeTimers()

      try {
        stubEventsIpc(() => true)

        const promise = configManager.mainProcessWillDisconnect()

        await jest.advanceTimersByTimeAsync(3000)

        await expect(promise).resolves.toBeUndefined()
      } finally {
        jest.useRealTimers()
      }
    })
  })
})
