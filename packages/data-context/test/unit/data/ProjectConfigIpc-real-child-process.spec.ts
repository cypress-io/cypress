import { describe, expect, it, beforeAll, beforeEach, afterEach, jest } from '@jest/globals'
import path from 'path'
import { scaffoldCommonNodeModules } from '@tooling/system-tests/lib/dep-installer'
import { scaffoldMigrationProject as scaffoldProject } from '../helper'
import { ProjectConfigIpc } from '../../../src/data/ProjectConfigIpc'

jest.mock('debug', () => {
  globalThis.debugMessages = []
  const originalDebugModule = jest.requireActual('debug')

  const debug = (namespace) => {
    // @ts-expect-error - mock
    const originalDebug = originalDebugModule(namespace)

    return ((message) => {
      if (namespace === 'cypress:lifecycle:ProjectConfigIpc') {
        globalThis.debugMessages.push(message)
      }

      originalDebug(message)
    })
  }

  debug.formatters = {}

  return debug
})

describe('ProjectConfigIpc', () => {
  describe('real-child-process', () => {
    let projectConfigIpc

    beforeAll(async () => {
      await scaffoldCommonNodeModules()
    })

    beforeEach(async () => {
      const projectPath = await scaffoldProject('e2e')

      projectConfigIpc = new ProjectConfigIpc(
        undefined,
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
