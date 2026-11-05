import { describe, expect, it, beforeAll, beforeEach, afterEach, jest } from '@jest/globals'
import os from 'os'
import path from 'path'
import { scaffoldCommonNodeModules } from '@tooling/system-tests/lib/dep-installer'
import { createTestDataContext, scaffoldMigrationProject as scaffoldProject } from '../helper'
import { ProjectConfigIpc } from '../../../src/data/ProjectConfigIpc'
import { ProjectConfigManager } from '../../../src/data/ProjectConfigManager'
import { EventRegistrar } from '../../../src/data/EventRegistrar'

jest.mock('debug', () => {
  globalThis.debugMessages = []
  const originalDebugModule = jest.requireActual('debug')

  const debug = (namespace) => {
    // @ts-expect-error - mock
    const originalDebug = originalDebugModule(namespace)

    // other namespaces get the real debugger, since dependencies such as
    // simple-git call instance methods like `extend` when they're imported
    if (namespace !== 'cypress:lifecycle:ProjectConfigIpc') {
      return originalDebug
    }

    return ((message) => {
      globalThis.debugMessages.push(message)

      originalDebug(message)
    })
  }

  debug.formatters = {}

  return debug
})

describe('ProjectConfigIpc', () => {
  describe('real-child-process', () => {
    let projectConfigIpc
    let projectRoot: string

    beforeAll(async () => {
      await scaffoldCommonNodeModules()
    })

    beforeEach(async () => {
      const projectPath = await scaffoldProject('e2e')

      projectRoot = projectPath

      projectConfigIpc = new ProjectConfigIpc(
        undefined,
        projectPath,
        path.join(projectPath, 'cypress.config.js'),
        'cypress.config.js',
        (error) => {},
        () => {},
        () => {},
      )
    })

    afterEach(() => {
      projectConfigIpc.cleanupIpc()
    })

    it('reports a SIGKILLed child once and rejects an in-flight node event', async () => {
      const onError = jest.fn()
      const ipc = new ProjectConfigIpc(undefined, projectRoot, path.join(projectRoot, 'cypress.config.js'), 'cypress.config.js', onError, () => {}, () => {})
      const eventRegistrar = new EventRegistrar()
      const manager: any = new ProjectConfigManager({
        ctx: createTestDataContext('open'),
        configFile: false,
        projectRoot,
        handlers: [],
        hasCypressEnvFile: false,
        eventRegistrar,
        onError: () => {},
        onInitialConfigLoaded: () => {},
        onFinalConfigLoaded: () => Promise.resolve(),
        refreshLifecycle: () => Promise.resolve(),
      })

      manager.loadCypressEnvFile = async () => ({})
      manager.buildBaseFullConfig = async () => ({ resolved: {} })
      manager.watchFiles = () => {}

      try {
        const loadConfigReply = await ipc.loadConfig()
        const reply = await ipc.callSetupNodeEventsWithConfig('e2e', {} as any, [])

        await manager.handleSetupTestingTypeReply(ipc, loadConfigReply, { ...reply, registrations: [{ event: 'after:spec', eventId: 'unknown' }] })

        const inFlight = eventRegistrar.executeNodeEvent('after:spec', [])

        process.kill(ipc.childProcessPid!, 'SIGKILL')

        await expect(inFlight).rejects.toMatchObject({ type: 'CONFIG_PROCESS_EXITED_UNEXPECTEDLY' })
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0][0]).toMatchObject({ type: 'CONFIG_PROCESS_EXITED_UNEXPECTEDLY', message: expect.stringContaining('exited unexpectedly') })

        // Windows has no signals, so a killed child reports an exit code instead
        if (os.platform() !== 'win32') {
          expect(onError.mock.calls[0][0].message).toContain('SIGKILL')
        }
      } finally {
        ipc.cleanupIpc()
      }
    }, 30_000)

    it('EPIPE error test', async () => {
      const err: NodeJS.ErrnoException = new Error

      err.code = 'EPIPE'

      const OG_once = projectConfigIpc.once

      projectConfigIpc.once = function (evt, listener) {
        if (evt === 'setupTestingType:reply') {
          return listener()
        }

        return OG_once.apply(this, [evt, listener])
      }

      await projectConfigIpc.loadConfig()
      await projectConfigIpc.registerSetupIpcHandlers()

      // Constructor forwards child `error` to `this.emit('error')`; Node throws if nothing listens.
      projectConfigIpc.on('error', () => {})

      projectConfigIpc._childProcess.emit('error', err)

      expect(globalThis.debugMessages.at(-2)).toEqual('EPIPE error in loadConfig() of child process %s')
      expect(globalThis.debugMessages.at(-1)).toEqual('EPIPE error in registerSetupIpcHandlers() of child process %s')
    }, 20_000)
  })
})
