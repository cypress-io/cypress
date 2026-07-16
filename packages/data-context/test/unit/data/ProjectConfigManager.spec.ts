import { describe, expect, it, beforeEach } from '@jest/globals'
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

  describe('#mainProcessWillDisconnect', () => {
    it('resolves when there is no events ipc', async () => {
      // @ts-expect-error
      configManager._eventsIpc = undefined

      await expect(configManager.mainProcessWillDisconnect()).resolves.toBeUndefined()
    })

    it('resolves when the child acks disconnect', async () => {
      const listeners: Record<string, Function[]> = {}
      const ipc = {
        send: jest.fn(),
        on: jest.fn((event: string, cb: Function) => {
          listeners[event] = listeners[event] || []
          listeners[event].push(cb)
        }),
        childProcessPid: 123,
      }

      // @ts-expect-error
      configManager._eventsIpc = ipc

      const pending = configManager.mainProcessWillDisconnect()

      expect(ipc.send).toHaveBeenCalledWith('main:process:will:disconnect')
      listeners['main:process:will:disconnect:ack'].forEach((cb) => cb())

      await expect(pending).resolves.toBeUndefined()
    })

    it('resolves when the disconnect ack times out', async () => {
      jest.useFakeTimers()

      const ipc = {
        send: jest.fn(),
        on: jest.fn(),
        childProcessPid: 123,
      }

      // @ts-expect-error
      configManager._eventsIpc = ipc

      const pending = configManager.mainProcessWillDisconnect()

      jest.advanceTimersByTime(5000)

      await expect(pending).resolves.toBeUndefined()

      jest.useRealTimers()
    })
  })
})
