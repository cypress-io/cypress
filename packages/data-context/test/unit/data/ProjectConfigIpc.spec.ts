import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import assert from 'assert'
import childProcess from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'
import { scaffoldMigrationProject as scaffoldProject } from '../helper'
import { ProjectConfigIpc } from '../../../src/data/ProjectConfigIpc'

jest.mock('child_process')

const stubFork = () => {
  jest.mocked(childProcess.fork).mockImplementation(() => {
    // Safe because these tests only check how the process is forked and never talk to it
    return {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      kill: jest.fn(),
      removeAllListeners: jest.fn(),
    } as unknown as ChildProcess
  })
}

describe('ProjectConfigIpc', () => {
  describe('#eventProcessPid', () => {
    let projectConfigIpc: ProjectConfigIpc

    beforeEach(async () => {
      const projectPath = await scaffoldProject('e2e')

      stubFork()

      projectConfigIpc = new ProjectConfigIpc(
        undefined,
        projectPath,
        'cypress.config.js',
        false,
        (error) => {},
        () => {},
        () => {},
      )
    })

    afterEach(() => {
      projectConfigIpc.cleanupIpc()
      jest.clearAllMocks()
    })

    it('returns id for child process', () => {
      const expectedId = projectConfigIpc['_childProcess'].pid

      expect(projectConfigIpc.childProcessPid).toEqual(expectedId)
    })
  })

  describe('forkChildProcess', () => {
    let projectConfigIpc: ProjectConfigIpc

    beforeEach(() => {
      process.env.CYPRESS_INTERNAL_MOCK_TYPESCRIPT_INSTALL = 'true'
    })

    afterEach(() => {
      delete process.env.CYPRESS_INTERNAL_MOCK_TYPESCRIPT_INSTALL
      projectConfigIpc.cleanupIpc()
    })

    describe('config module format detection', () => {
      const MOCK_NODE_PATH = '/Users/foo/.nvm/versions/node/v22.15.0/bin/node'

      beforeEach(() => {
        stubFork()
      })

      const MODULE_FORMAT_CASES = [
        {
          description: '.mts without type:module',
          project: 'config-cjs-and-esm/config-with-ts-tsconfig-es2015',
          // synthetic path — fixture has cypress.config.ts only
          configFile: 'cypress.config.mts',
          shouldLoadAsEsm: 'true',
        },
        {
          description: '.mts with type:module',
          project: 'config-cjs-and-esm/config-with-ts-module',
          // synthetic path — fixture has cypress.config.ts only
          configFile: 'cypress.config.mts',
          shouldLoadAsEsm: 'true',
        },
        {
          description: '.cts without type:module',
          project: 'config-cjs-and-esm/config-with-ts-tsconfig-es2015',
          // synthetic path — fixture has cypress.config.ts only
          configFile: 'cypress.config.cts',
          shouldLoadAsEsm: 'false',
        },
        {
          description: '.cts with type:module',
          project: 'config-cjs-and-esm/config-with-ts-module',
          // synthetic path — fixture has cypress.config.ts only
          configFile: 'cypress.config.cts',
          shouldLoadAsEsm: 'false',
        },
        {
          description: '.ts without type:module',
          project: 'config-cjs-and-esm/config-with-ts-tsconfig-es2015',
          configFile: 'cypress.config.ts',
          shouldLoadAsEsm: 'false',
        },
        {
          description: '.ts with type:module',
          project: 'config-cjs-and-esm/config-with-ts-module',
          configFile: 'cypress.config.ts',
          shouldLoadAsEsm: 'true',
        },
        {
          description: '.mjs without type:module',
          project: 'config-cjs-and-esm/config-with-mjs',
          // real fixture file
          configFile: 'cypress.config.mjs',
          shouldLoadAsEsm: 'true',
        },
        {
          description: '.mjs with type:module',
          project: 'config-cjs-and-esm/config-with-js-module',
          // synthetic path — fixture has cypress.config.js only
          configFile: 'cypress.config.mjs',
          shouldLoadAsEsm: 'true',
        },
      ] as const

      MODULE_FORMAT_CASES.forEach(({ description, project, configFile, shouldLoadAsEsm }) => {
        it(`passes shouldLoadAsEsm=${shouldLoadAsEsm} for ${description}`, async () => {
          // @ts-expect-error - scaffoldMigrationProject is typed for top-level fixture dirs only, but nested fixture paths scaffold the same way
          const projectPath = await scaffoldProject(project)
          const configFilePath = path.join(projectPath, configFile)

          projectConfigIpc = new ProjectConfigIpc(
            MOCK_NODE_PATH,
            projectPath,
            configFilePath,
            false,
            (error) => {},
            () => {},
            () => {},
          )

          expect(childProcess.fork).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([
            '--shouldLoadAsEsm',
            shouldLoadAsEsm,
          ]), expect.any(Object))
        })
      })
    })

    describe('typescript', () => {
      const PROJECTS = [
        {
          project: 'config-cjs-and-esm/config-with-ts-module',
          configFile: 'cypress.config.ts',
        },
        {
          project: 'config-cjs-and-esm/config-with-module-resolution-bundler',
          configFile: 'cypress.config.js',
        },
        {
          project: 'config-cjs-and-esm/config-with-js-module',
          configFile: 'cypress.config.js',
        },
        {
          project: 'config-cjs-and-esm/config-with-cjs',
          configFile: 'cypress.config.cjs',
        },
      ]

      beforeEach(() => {
        stubFork()
      })

      PROJECTS.forEach(({ project, configFile }) => {
        it(`${project}: tsx generic loader (esm/commonjs/typescript)`, async () => {
          // @ts-expect-error - scaffoldMigrationProject is typed for top-level fixture dirs only, but nested fixture paths scaffold the same way
          const projectPath = await scaffoldProject(project)
          const configFilePath = path.join(projectPath, configFile)

          projectConfigIpc = new ProjectConfigIpc(
            undefined,
            projectPath,
            configFilePath,
            false,
            (error) => {},
            () => {},
            () => {},
          )

          // For node 20.6.0 and up, we use the --import flag
          expect(childProcess.fork).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.objectContaining({
            env: expect.objectContaining({
              NODE_OPTIONS: expect.stringMatching(/--import ".*cypress\/node_modules\/tsx\/dist\/loader.mjs"/),
            }),
          }))

          // the marker require_async_child uses to strip the loader from NODE_OPTIONS
          expect(childProcess.fork).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([
            expect.stringMatching(/^--tsxLoaderOptions=--import ".*cypress\/node_modules\/tsx\/dist\/loader.mjs"$/),
          ]), expect.any(Object))

          if (project.includes('config-with-ts-module') || project.includes('config-with-module-resolution-bundler')) {
            // these projects have typescript installed and have a tsconfig, so the TSX_TSCONFIG_PATH should be set to the project path
            expect(childProcess.fork).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.objectContaining({
              env: expect.objectContaining({
                TSX_TSCONFIG_PATH: expect.stringMatching(`/cy-projects/${project}/tsconfig.json`),
              }),
            }))
          } else {
            // non typescript projects that do NOT have a tsconfig, so the TSX_TSCONFIG_PATH should be undefined
            expect(childProcess.fork).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.objectContaining({
              env: expect.not.objectContaining({
                TSX_TSCONFIG_PATH: expect.any(String),
              }),
            }))
          }
        }, 30000)
      })
    })

    describe('NODE_TLS_REJECT_UNAUTHORIZED', () => {
      const originalEnv = process.env

      beforeEach(() => {
        stubFork()
      })

      afterEach(() => {
        process.env = originalEnv
      })

      // The server sets NODE_TLS_REJECT_UNAUTHORIZED to '0' and records the user's value in CYPRESS_INTERNAL_ORIGINAL_NODE_TLS_REJECT_UNAUTHORIZED
      const getConfigProcessEnv = async (serverEnv: NodeJS.ProcessEnv) => {
        process.env = { ...originalEnv, ...serverEnv }

        const projectPath = await scaffoldProject('e2e')

        projectConfigIpc = new ProjectConfigIpc(
          undefined,
          projectPath,
          path.join(projectPath, 'cypress.config.js'),
          false,
          (error) => {},
          () => {},
          () => {},
        )

        const forkCall = jest.mocked(childProcess.fork).mock.lastCall

        assert(forkCall)

        const [, , options] = forkCall

        assert(options?.env)

        return options.env
      }

      it('is not set when the user did not set it', async () => {
        const env = await getConfigProcessEnv({ NODE_TLS_REJECT_UNAUTHORIZED: '0' })

        expect(env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined()
      })

      it('is the value the user set', async () => {
        const env = await getConfigProcessEnv({ NODE_TLS_REJECT_UNAUTHORIZED: '0', CYPRESS_INTERNAL_ORIGINAL_NODE_TLS_REJECT_UNAUTHORIZED: '1' })

        expect(env.NODE_TLS_REJECT_UNAUTHORIZED).toEqual('1')
      })
    })
  })
})
