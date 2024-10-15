import childProcess from 'child_process'
import { expect } from 'chai'
import sinon from 'sinon'
import { scaffoldMigrationProject as scaffoldProject } from '../helper'
import { ProjectConfigIpc } from '../../../src/data/ProjectConfigIpc'

describe('ProjectConfigIpc', () => {
  context('#eventProcessPid', () => {
    let projectConfigIpc

    beforeEach(async () => {
      const projectPath = await scaffoldProject('e2e')

      projectConfigIpc = new ProjectConfigIpc(
        undefined,
        undefined,
        projectPath,
        'cypress.config.js',
        false,
        (error) => {},
        () => {},
      )
    })

    afterEach(() => {
      projectConfigIpc.cleanupIpc()
    })

    it('returns id for child process', () => {
      const expectedId = projectConfigIpc._childProcess.pid

      expect(projectConfigIpc.childProcessPid).to.eq(expectedId)
    })
  })

  context('forkChildProcess', () => {
    const NODE_VERSIONS = ['18.20.4', '20.17.0']
    const NODE_VERSIONS_22_7_0_AND_UP = ['22.7.0', '22.11.4']

    let projectConfigIpc
    let forkSpy

    beforeEach(() => {
      process.env.CYPRESS_INTERNAL_MOCK_TYPESCRIPT_INSTALL = 'true'
      forkSpy = sinon.spy(childProcess, 'fork')
    })

    afterEach(() => {
      delete process.env.CYPRESS_INTERNAL_MOCK_TYPESCRIPT_INSTALL
      forkSpy.restore()
      projectConfigIpc.cleanupIpc()
    })

    context('typescript', () => {
      [...NODE_VERSIONS, ...NODE_VERSIONS_22_7_0_AND_UP].forEach((nodeVersion) => {
        context(`node v${nodeVersion}`, () => {
          context('ESM', () => {
            it('uses the experimental module loader if ESM is being used with typescript', async () => {
              // @ts-expect-error
              const projectPath = await scaffoldProject('config-cjs-and-esm/config-with-ts-module')

              const MOCK_NODE_PATH = `/Users/foo/.nvm/versions/node/v${nodeVersion}/bin/node`
              const MOCK_NODE_VERSION = nodeVersion

              projectConfigIpc = new ProjectConfigIpc(
                MOCK_NODE_PATH,
                MOCK_NODE_VERSION,
                projectPath,
                'cypress.config.js',
                false,
                (error) => {},
                () => {},
              )

              expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                env: {
                  NODE_OPTIONS: sinon.match('--experimental-specifier-resolution=node --loader'),
                },
              }))
            })

            // @see https://github.com/cypress-io/cypress/issues/30084
            // at time of writing, 22.11.4 is a node version that does not exist. We are using this version to test the logic for future proofing.
            if (NODE_VERSIONS_22_7_0_AND_UP.includes(nodeVersion)) {
              it(`additionally adds --no-experimental-detect-module for node versions 22.7.0 and up if ESM is being used with typescript`, async () => {
                // @ts-expect-error
                const projectPath = await scaffoldProject('config-cjs-and-esm/config-with-ts-module')

                const MOCK_NODE_PATH = `/Users/foo/.nvm/versions/node/v${nodeVersion}/bin/node`
                const MOCK_NODE_VERSION = nodeVersion

                projectConfigIpc = new ProjectConfigIpc(
                  MOCK_NODE_PATH,
                  MOCK_NODE_VERSION,
                  projectPath,
                  'cypress.config.js',
                  false,
                  (error) => {},
                  () => {},
                )

                expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    NODE_OPTIONS: sinon.match('--no-experimental-detect-module'),
                  },
                }))
              })
            }
          })

          context('CommonJS', () => {
            it('uses the ts_node commonjs loader if CommonJS is being used with typescript', async () => {
              // @ts-expect-error
              const projectPath = await scaffoldProject('config-cjs-and-esm/config-with-module-resolution-bundler')

              const MOCK_NODE_PATH = `/Users/foo/.nvm/versions/node/v${nodeVersion}/bin/node`
              const MOCK_NODE_VERSION = nodeVersion

              projectConfigIpc = new ProjectConfigIpc(
                MOCK_NODE_PATH,
                MOCK_NODE_VERSION,
                projectPath,
                'cypress.config.js',
                false,
                (error) => {},
                () => {},
              )

              expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                env: {
                  NODE_OPTIONS: sinon.match('--require'),
                },
              }))
            })
          })
        })
      })
    })
  })
})
