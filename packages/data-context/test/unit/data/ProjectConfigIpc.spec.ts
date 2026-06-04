import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import childProcess from 'child_process'
import path from 'path'
import semver from 'semver'
import { scaffoldMigrationProject as scaffoldProject } from '../helper'
import { ProjectConfigIpc } from '../../../src/data/ProjectConfigIpc'

jest.mock('child_process')

describe('ProjectConfigIpc', () => {
  describe('#eventProcessPid', () => {
    let projectConfigIpc

    beforeEach(async () => {
      const projectPath = await scaffoldProject('e2e')

      // @ts-expect-error - mock
      childProcess.fork.mockImplementation(() => {
        return {
          on: jest.fn(),
          once: jest.fn(),
          emit: jest.fn(),
          kill: jest.fn(),
          removeAllListeners: jest.fn(),
        }
      })

      projectConfigIpc = new ProjectConfigIpc(
        undefined,
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
      const expectedId = projectConfigIpc._childProcess.pid

      expect(projectConfigIpc.childProcessPid).toEqual(expectedId)
    })
  })

  describe('forkChildProcess', () => {
    // some of these node versions may not exist, but we want to verify
    // the experimental flags are correctly disabled for future versions
    const NODE_VERSIONS = ['20.5.1', '20.6.0', '20.19.1', '22.15.0']

    const lastVersionWithDeprecatedLoaderOption = '20.5.1'

    let projectConfigIpc

    beforeEach(() => {
      process.env.CYPRESS_INTERNAL_MOCK_TYPESCRIPT_INSTALL = 'true'
    })

    afterEach(() => {
      delete process.env.CYPRESS_INTERNAL_MOCK_TYPESCRIPT_INSTALL
      projectConfigIpc.cleanupIpc()
    })

    describe('config module format detection', () => {
      const MOCK_NODE_PATH = '/Users/foo/.nvm/versions/node/v22.15.0/bin/node'
      const MOCK_NODE_VERSION = '22.15.0'

      beforeEach(() => {
        // @ts-expect-error - mock
        childProcess.fork.mockImplementation(() => {
          return {
            on: jest.fn(),
            once: jest.fn(),
            emit: jest.fn(),
            kill: jest.fn(),
            removeAllListeners: jest.fn(),
          }
        })
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
          const projectPath = await scaffoldProject(project)
          const configFilePath = path.join(projectPath, configFile)

          projectConfigIpc = new ProjectConfigIpc(
            MOCK_NODE_PATH,
            MOCK_NODE_VERSION,
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
      [...NODE_VERSIONS].forEach((nodeVersion) => {
        const MOCK_NODE_PATH = `/Users/foo/.nvm/versions/node/v${nodeVersion}/bin/node`
        const MOCK_NODE_VERSION = nodeVersion

        describe(`node v${nodeVersion}`, () => {
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

          PROJECTS.forEach(({ project, configFile }) => {
            it(`${project}: tsx generic loader (esm/commonjs/typescript)`, async () => {
              const projectPath = await scaffoldProject(project)
              const configFilePath = path.join(projectPath, configFile)

              projectConfigIpc = new ProjectConfigIpc(
                MOCK_NODE_PATH,
                MOCK_NODE_VERSION,
                projectPath,
                configFilePath,
                false,
                (error) => {},
                () => {},
                () => {},
              )

              // make sure that we use tsx for every file, regardless of typescript, esm, or commonjs
              if (semver.lte(nodeVersion, lastVersionWithDeprecatedLoaderOption)) {
                // For node 20.5.1 and down, we need use the --loader flag
                expect(childProcess.fork).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.objectContaining({
                  env: expect.objectContaining({
                    NODE_OPTIONS: expect.stringMatching(/--loader ".*cypress\/node_modules\/tsx\/dist\/loader.mjs"/),
                  }),
                }))
              } else {
                // For node 20.6.0 and up, we need use the --import flag
                expect(childProcess.fork).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.objectContaining({
                  env: expect.objectContaining({
                    NODE_OPTIONS: expect.stringMatching(/--import ".*cypress\/node_modules\/tsx\/dist\/loader.mjs"/),
                  }),
                }))
              }

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
      })
    })
  })
})
