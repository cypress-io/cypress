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
    const NODE_VERSIONS = ['20.5.1', '20.6.0', '20.19.1', '22.15.0']

    const lastVersionWithDeprecatedLoaderOption = '20.5.1'

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
        const MOCK_NODE_PATH = `/Users/foo/.nvm/versions/node/v${nodeVersion}/bin/node`
        const MOCK_NODE_VERSION = nodeVersion

        context(`node v${nodeVersion}`, () => {
          const PROJECTS = ['config-cjs-and-esm/config-with-ts-module', 'config-cjs-and-esm/config-with-module-resolution-bundler', 'config-cjs-and-esm/config-with-js-module', 'config-cjs-and-esm/config-with-cjs']

          PROJECTS.forEach((project) => {
            it(`${project}: tsx generic loader (esm/commonjs/typescript)`, async () => {
              const projectPath = await scaffoldProject(project)

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

              // make sure that we use tsx for every file, regardless of typescript, esm, or commonjs
              if (semver.lte(nodeVersion, lastVersionWithDeprecatedLoaderOption)) {
                // For node 20.5.1 and down, we need use the --loader flag
                expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    NODE_OPTIONS: sinon.match(/--loader ".*cypress\/node_modules\/tsx\/dist\/loader.mjs"/),
                  },
                }))
              } else {
                // For node 20.6.0 and up, we need use the --import flag
                expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    NODE_OPTIONS: sinon.match(/--import ".*cypress\/node_modules\/tsx\/dist\/loader.mjs"/),
                  },
                }))
              }

              if (project.includes('config-with-ts-module') || project.includes('config-with-module-resolution-bundler')) {
                // these projects have typescript installed and have a tsconfig, so the TSX_TSCONFIG_PATH should be set to the project path
                expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    TSX_TSCONFIG_PATH: sinon.match(`/cy-projects/${project}/tsconfig.json`),
                  },
                }))
              } else {
                // non typescript projects that do NOT have a tsconfig, so the TSX_TSCONFIG_PATH should be undefined
                expect(forkSpy).to.have.been.calledWith(sinon.match.string, sinon.match.array, sinon.match({
                  env: {
                    TSX_TSCONFIG_PATH: undefined,
                  },
                }))
              }
            })
          })
        })
      })
    })
  })
})
