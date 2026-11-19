import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import childProcess from 'child_process'
import EventEmitter from 'events'
import { createTestDataContext } from '../helper'
import { ProjectConfigIpc } from '../../../src/data/ProjectConfigIpc'
import { ProjectConfigManager } from '../../../src/data/ProjectConfigManager'
import { EventRegistrar } from '../../../src/data/EventRegistrar'

jest.mock('child_process')

class FakeChild extends EventEmitter {
  pid = 1234
  killed = false
  connected = true
  stdout = null
  stderr = null
  send = jest.fn(() => true)
  kill = jest.fn(() => {
    this.killed = true

    return true
  })
}

describe('config process exit', () => {
  let child: FakeChild
  let onError: jest.Mock
  let ipc: ProjectConfigIpc

  beforeEach(() => {
    child = new FakeChild()
    // @ts-expect-error - mock
    childProcess.fork.mockImplementation(() => child)
    onError = jest.fn()
    ipc = new ProjectConfigIpc(undefined, '/project', '/project/cypress.config.js', 'cypress.config.js', onError, () => {}, () => {})
  })

  afterEach(() => {
    ipc.cleanupIpc()
    jest.clearAllMocks()
  })

  const finishSetup = async () => {
    const setup = ipc.callSetupNodeEventsWithConfig('e2e', {} as any, [])

    ipc.emit('setupTestingType:reply', { setupConfig: null, requires: [], registrations: [] })
    await setup
  }

  describe('ProjectConfigIpc', () => {
    it('reports an unexpected exit after setup once, with the signal', async () => {
      await finishSetup()

      child.emit('exit', null, 'SIGKILL')

      expect(onError).toHaveBeenCalledTimes(1)
      const err = onError.mock.calls[0][0] as any

      expect(err.type).toBe('CONFIG_PROCESS_EXITED_UNEXPECTEDLY')
      expect(err.message).toContain('SIGKILL')
      expect(err.message).toContain('ran out of memory')
      expect(ipc.unexpectedExit).toBe(err)
    })

    it('names the dev server for a component testing SIGKILL', async () => {
      const setup = ipc.callSetupNodeEventsWithConfig('component', {} as any, [])

      ipc.emit('setupTestingType:reply', { setupConfig: null, requires: [], registrations: [] })
      await setup

      child.emit('exit', null, 'SIGKILL')

      expect((onError.mock.calls[0][0] as any).message).toContain('dev server')
    })

    it('names the exit code and omits the memory hint for a non-SIGKILL exit', async () => {
      await finishSetup()

      child.emit('exit', 3, null)

      const message = (onError.mock.calls[0][0] as any).message

      expect(message).toContain('code 3')
      expect(message).not.toContain('memory')
    })

    it('cleans up and lets the throw propagate when onError throws because the run has no exit-early handler yet', async () => {
      onError.mockImplementation(() => {
        throw new Error('no runModeExitEarly')
      })

      await finishSetup()

      expect(() => child.emit('exit', null, 'SIGKILL')).toThrow('no runModeExitEarly')
      expect(ipc.unexpectedExit).toBeDefined()
      expect(ipc.listenerCount('export:telemetry')).toBe(0)
    })

    it('rejects loadConfig, without calling onError, when the child exits before replying (#25507)', async () => {
      const loading = ipc.loadConfig()

      child.emit('exit', null, 'SIGKILL')

      await expect(loading).rejects.toMatchObject({ type: 'CONFIG_PROCESS_EXITED_UNEXPECTEDLY' })
      expect(onError).not.toHaveBeenCalled()
    })

    it('rejects setupTestingType, without calling onError, when the child exits before replying', async () => {
      const setup = ipc.callSetupNodeEventsWithConfig('e2e', {} as any, [])

      child.emit('exit', 1, null)

      await expect(setup).rejects.toMatchObject({ type: 'CONFIG_PROCESS_EXITED_UNEXPECTEDLY' })
      expect(onError).not.toHaveBeenCalled()
    })

    it('rejects setupTestingType immediately when the child already exited', async () => {
      child.emit('exit', 1, null)

      await expect(ipc.callSetupNodeEventsWithConfig('e2e', {} as any, [])).rejects.toMatchObject({ type: 'CONFIG_PROCESS_EXITED_UNEXPECTEDLY' })
    })

    it('stays silent when the exit was declared with expectExit, even if listeners are intact', async () => {
      await finishSetup()

      ipc.expectExit()
      child.emit('exit', 0, null)

      expect(onError).not.toHaveBeenCalled()
      expect(ipc.unexpectedExit).toBeUndefined()
    })

    it('keeps the reported error when the child exits after reporting a setup error', async () => {
      await finishSetup()

      const devServerErr = { type: 'DEV_SERVER_CONFIG_FILE_NOT_FOUND' }

      ipc.emit('setupTestingType:error', devServerErr)
      child.emit('exit', 0, null)

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(devServerErr)
      expect(ipc.unexpectedExit).toBeUndefined()
    })
  })

  describe('node event invocations', () => {
    let configManager: ProjectConfigManager
    let eventRegistrar: EventRegistrar

    beforeEach(async () => {
      eventRegistrar = new EventRegistrar()
      configManager = new ProjectConfigManager({
        ctx: createTestDataContext('open'),
        configFile: false,
        projectRoot: '/project',
        handlers: [],
        hasCypressEnvFile: false,
        eventRegistrar,
        onError: () => {},
        onInitialConfigLoaded: () => {},
        onFinalConfigLoaded: () => Promise.resolve(),
        refreshLifecycle: () => Promise.resolve(),
      })

      const internals = configManager as any

      internals.loadCypressEnvFile = async () => ({})
      internals.buildBaseFullConfig = async () => ({})
      internals.watchFiles = () => {}

      await finishSetup()
      await internals.handleSetupTestingTypeReply(ipc, { initialConfig: {}, requires: [] }, {
        setupConfig: null,
        requires: [],
        registrations: [{ event: 'after:spec', eventId: 'e1' }],
      })
    })

    it('rejects an in-flight invocation when the child exits, and leaves no listeners behind', async () => {
      const inFlight = eventRegistrar.executeNodeEvent('after:spec', [])

      expect(ipc.eventNames().filter((name) => String(name).startsWith('promise:fulfilled'))).toHaveLength(1)
      child.emit('exit', null, 'SIGKILL')

      await expect(inFlight).rejects.toBe(onError.mock.calls[0][0])
      expect(ipc.eventNames().filter((name) => String(name).startsWith('promise:fulfilled'))).toEqual([])
    })

    it('rejects every concurrent invocation when the child exits', async () => {
      const invocations = Array.from({ length: 25 }, () => eventRegistrar.executeNodeEvent('after:spec', []))

      child.emit('exit', null, 'SIGKILL')

      await Promise.all(invocations.map((invocation) => expect(invocation).rejects.toMatchObject({ type: 'CONFIG_PROCESS_EXITED_UNEXPECTEDLY' })))
    })

    it('leaves nothing attached to the ipc after answered invocations', async () => {
      const listenerNames = () => ipc.eventNames().map((name) => `${String(name)}:${ipc.listenerCount(name)}`).sort()
      const before = listenerNames()

      for (let i = 0; i < 25; i++) {
        const invocation = eventRegistrar.executeNodeEvent('after:spec', [])
        const [, ids] = (child.send.mock.calls.at(-1) as any)[0].args as [string, { invocationId: string }]

        ipc.emit(`promise:fulfilled:${ids.invocationId}`, null, i)
        await expect(invocation).resolves.toBe(i)
      }

      expect(listenerNames()).toEqual(before)
    })

    it('rejects a later invocation immediately', async () => {
      child.emit('exit', null, 'SIGKILL')

      await expect(eventRegistrar.executeNodeEvent('after:spec', [])).rejects.toMatchObject({ type: 'CONFIG_PROCESS_EXITED_UNEXPECTEDLY' })
    })

    it('removes its listeners once the invocation is answered', async () => {
      const invocation = eventRegistrar.executeNodeEvent('after:spec', [])
      const [, ids] = (child.send.mock.calls.at(-1) as any)[0].args as [string, { invocationId: string }]

      ipc.emit(`promise:fulfilled:${ids.invocationId}`, null, 'done')

      await expect(invocation).resolves.toBe('done')
      expect(ipc.eventNames().filter((name) => String(name).startsWith('promise:fulfilled'))).toEqual([])
    })

    it('does not reject when the main process disconnects the child on purpose', async () => {
      const internals = configManager as any

      internals._eventsIpc = ipc

      const disconnecting = configManager.mainProcessWillDisconnect()

      ipc.emit('main:process:will:disconnect:ack')
      await disconnecting
      child.emit('exit', 0, null)

      expect(ipc.unexpectedExit).toBeUndefined()
    })
  })
})
