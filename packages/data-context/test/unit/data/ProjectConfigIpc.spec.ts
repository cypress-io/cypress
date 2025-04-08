import childProcess from 'child_process'
import { expect } from 'chai'
import semver from 'semver'
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
    // some of these node versions may not exist, but we want to verify
    // the experimental flags are correctly disabled for future versions
    const NODE_VERSIONS = ['18.20.4', '20.17.0', '20.19.0', '22.0.0', '22.7.0', '22.11.4', '22.12.0', '22.15.0']
    const experimentalDetectModuleIntroduced = '22.7.0'
    const experimentalRequireModuleIntroduced = '22.12.0'
    const minorPatchExperimentalModuleIntroduced = '>= 20.19.0 < 21.0.0'

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
      [...NODE_VERSIONS].forEach((nodeVersion) => {
        context(`node v${nodeVersion}`, () => {
          context('ESM', () => {
            it('passes the correct experimental flags if ESM is being used with typescript', async () => {
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
                () => {},
              )

              expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                env: {
                  NODE_OPTIONS: sinon.match('--experimental-specifier-resolution=node --loader'),
                },
              }))

              if (semver.gte(nodeVersion, experimentalDetectModuleIntroduced) || semver.satisfies(nodeVersion, minorPatchExperimentalModuleIntroduced)) {
                expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    NODE_OPTIONS: sinon.match('--no-experimental-detect-module'),
                  },
                }))
              }

              if (semver.gte(nodeVersion, experimentalRequireModuleIntroduced) || semver.satisfies(nodeVersion, minorPatchExperimentalModuleIntroduced)) {
                expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    NODE_OPTIONS: sinon.match('--no-experimental-require-module'),
                  },
                }))
              }

              if (semver.eq(nodeVersion, '22.0.0')) {
                expect(forkSpy).to.not.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    NODE_OPTIONS: sinon.match('--no-experimental-detect-module'),
                  },
                }))

                expect(forkSpy).to.not.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    NODE_OPTIONS: sinon.match('--no-experimental-require-module'),
                  },
                }))
              }
            })
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
