import sinon from 'sinon'
import fs from 'fs-extra'
import { expect } from 'chai'
import path from 'path'
import os from 'os'

import { scaffoldProject, removeProject, createTestDataContext } from '../helper'
import * as FileDataSourceModule from '../../../src/sources/FileDataSource'
import { DataContext } from '../../../src'
import * as fileUtil from '../../../src/util/file'

const FileDataSource = FileDataSourceModule.FileDataSource

describe('FileDataSource', () => {
  describe('#getFilesByGlob', () => {
    describe('integration', () => {
      let projectPath: string
      let scriptsFolder: string
      let ctx: DataContext
      let fileDataSource

      beforeEach(async () => {
        projectPath = await scaffoldProject('globby-test-bed')
        scriptsFolder = path.join(projectPath, 'scripts')

        ctx = createTestDataContext('open')
        ctx.coreData.currentTestingType = 'e2e'

        fileDataSource = new FileDataSource(ctx)
      })

      afterEach(() => {
        removeProject('globby-test-bed')
        sinon.restore()
      })

      describe('#getFilesByGlob', () => {
        it('finds files at root matching given pattern using globby', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            'root-script-*.js',
          )

          expect(files).to.have.length(2)
          expect(files[0]).to.eq(fileUtil.toPosix(path.join(projectPath, 'root-script-1.js')))
          expect(files[1]).to.eq(fileUtil.toPosix(path.join(projectPath, 'root-script-2.js')))
        })

        it('finds files matching relative patterns in working dir', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            './root-script-*.js',
          )

          expect(files).to.have.length(2)
        })

        it('finds files matching patterns that include working dir', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            `${projectPath}/root-script-*.js`,
          )

          expect(files).to.have.length(2)
        })

        it('does not replace working directory in glob pattern if it is not leading', async () => {
          // Create a redundant structure within the project dir matching its absolute path
          // and write a new script in that location

          // project path on windows contains drive letter, cannot be joined directly
          const nestedScriptPath = path.join(projectPath, 'cypress', path.parse(projectPath).base)

          await fs.mkdirs(nestedScriptPath)
          await fs.writeFile(path.join(nestedScriptPath, 'nested-script.js'), '')

          // Verify that the glob pattern is not impacted if it contains directories equivalent
          // to the working directory
          let files = await fileDataSource.getFilesByGlob(
            projectPath,
            `./cypress/${path.parse(projectPath).base}/nested-script.js`,
          )

          expect(files).to.have.length(1)
        })

        it('finds files matching multiple patterns', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            ['root-script-*.js', 'scripts/**/*.js'],
          )

          expect(files).to.have.length(5)
        })

        it('does not find files outside of working dir', async () => {
          const files = await fileDataSource.getFilesByGlob(
            scriptsFolder,
            ['root-script-*.js', './**/*.js'],
          )

          expect(files).to.have.length(3)
        })

        it('by default ignores files within node_modules', async () => {
          const nodeModulesPath = path.join(projectPath, 'node_modules')

          await fs.mkdir(nodeModulesPath)
          await fs.writeFile(path.join(nodeModulesPath, 'module-script-1.js'), '')
          await fs.writeFile(path.join(nodeModulesPath, 'module-script-2.js'), '')

          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            '**/*script-*.js',
            { ignore: ['./scripts/**/*'] },
          )

          // only scripts at root should be found, as node_modules is implicitly ignored
          // and ./scripts is explicitly ignored
          expect(files).to.have.length(2)
        })

        it('does not ignores files within node_modules, if node_modules is in the glob path', async () => {
          const nodeModulesPath = path.join(projectPath, 'node_modules')

          await fs.mkdir(nodeModulesPath)
          await fs.writeFile(path.join(nodeModulesPath, 'module-script-1.js'), '')
          await fs.writeFile(path.join(nodeModulesPath, 'module-script-2.js'), '')
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            '**/(node_modules/)?*script-*.js',
            { ignore: ['./scripts/**/*'] },
          )

          // scripts at root (2 of them) and scripts at node_modules should be found
          // and ./scripts is explicitly ignored
          expect(files).to.have.length(4)
        })

        it('does not ignores files within node_modules, if node_modules is in the project path', async () => {
          const nodeModulesPath = path.join(projectPath, 'node_modules')

          await fs.mkdir(nodeModulesPath)
          await fs.writeFile(path.join(nodeModulesPath, 'module-script-1.js'), '')
          await fs.writeFile(path.join(nodeModulesPath, 'module-script-2.js'), '')
          await fs.writeFile(path.join(nodeModulesPath, 'module-script-3.js'), '')
          const files = await fileDataSource.getFilesByGlob(
            nodeModulesPath,
            '**/*script-*.js',
            { ignore: ['./scripts/**/*'] },
          )

          // only scripts at node_modules should be found, since it is the project path
          expect(files).to.have.length(3)
        })

        it('converts globs to POSIX paths on windows', async () => {
          const windowsSeperator = '\\'

          sinon.stub(os, 'platform').returns('win32')
          const toPosixStub = sinon.stub(fileUtil, 'toPosix').callsFake((path) => {
            return toPosixStub.wrappedMethod(path, windowsSeperator)
          })

          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            `**${windowsSeperator}*script-*.js`,
          )

          expect(files).to.have.length(5)
        })

        it('finds files using given globby options', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            'root-script-*.js',
            { absolute: false },
          )

          expect(files).to.have.length(2)
          expect(files[0]).to.eq('root-script-1.js')
          expect(files[1]).to.eq('root-script-2.js')
        })
      })
    })

    describe('unit', () => {
      const ctx = createTestDataContext('open')

      ctx.coreData.currentTestingType = 'e2e'

      const fileDataSource = new FileDataSource(ctx)
      const mockMatches = ['/mock/matches']
      const defaultGlobbyOptions = {
        onlyFiles: true,
        absolute: true,
        ignore: ['**/node_modules/**'],
      }

      let matchGlobsStub: sinon.SinonStub

      beforeEach(() => {
        matchGlobsStub = sinon.stub(FileDataSourceModule, 'matchGlobs').resolves(mockMatches)
      })

      afterEach(() => {
        sinon.restore()
      })

      it('matches absolute patterns when working directory is root', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          '/cypress/e2e/**.cy.js',
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['cypress/e2e/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/' },
        )
      })

      it('matches relative patterns when working directory is root', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          './project/**.cy.js',
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['./project/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/' },
        )
      })

      it('matches implicit relative patterns when working directory is root', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          'project/**.cy.js',
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['project/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/' },
        )
      })

      it('matches absolute patterns without including working dir in pattern', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/my/project',
          '/my/project/cypress/e2e/**.cy.js',
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['cypress/e2e/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/my/project' },
        )
      })

      it('matches absolute patterns that include a copy of the working dir structure', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/my/project',
          '/my/project/cypress/my/project/e2e/**.cy.js',
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['cypress/my/project/e2e/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/my/project' },
        )
      })

      it('uses supplied ignore option in conjunction with defaults', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          '/cypress/e2e/**.cy.js',
          { ignore: ['ignore/foo.*', '/ignore/bar.*'] },
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['cypress/e2e/**.cy.js'],
          {
            ...defaultGlobbyOptions,
            cwd: '/',
            ignore: ['ignore/foo.*', '/ignore/bar.*', ...defaultGlobbyOptions.ignore],
          },
        )
      })

      it('does not ignore node_modules, if the working dir is located inside node_modules', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/node_modules/project/',
          '/cypress/e2e/**.cy.js',
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['/cypress/e2e/**.cy.js'],
          {
            ...defaultGlobbyOptions,
            cwd: '/node_modules/project/',
            ignore: [],
          },
        )
      })

      it('does not ignore node_modules, if one of glob paths contains node_modules', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          [
            '/node_modules/cypress/e2e/**.cy.js',
            '/cypress/e2e/**.cy.js',
          ],
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          [
            'node_modules/cypress/e2e/**.cy.js',
            'cypress/e2e/**.cy.js',
          ],
          {
            ...defaultGlobbyOptions,
            cwd: '/',
            ignore: [],
          },
        )
      })

      it('uses supplied ignore options, when node_modules are not ignored', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/node_modules/project/',
          '/node_modules/test_package/e2e/**.cy.js',
          { ignore: ['ignore/foo.*', '/ignore/bar.*'] },
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['/node_modules/test_package/e2e/**.cy.js'],
          {
            ...defaultGlobbyOptions,
            cwd: '/node_modules/project/',
            ignore: ['ignore/foo.*', '/ignore/bar.*'],
          },
        )
      })

      it('uses supplied globby options', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          '/cypress/e2e/**.cy.js',
          { absolute: false, objectMode: true },
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.been.calledWith(
          ['cypress/e2e/**.cy.js'],
          {
            ...defaultGlobbyOptions,
            cwd: '/',
            absolute: false,
            objectMode: true,
          },
        )
      })

      it('should retry search with `suppressErrors` if non-suppressed attempt fails', async () => {
        matchGlobsStub.onFirstCall().rejects(new Error('mocked filesystem error'))
        matchGlobsStub.onSecondCall().resolves(mockMatches)

        const files = await fileDataSource.getFilesByGlob(
          '/',
          '/cypress/e2e/**.cy.js',
          { absolute: false, objectMode: true },
        )

        expect(files).to.eq(mockMatches)
        expect(matchGlobsStub).to.have.callCount(2)
        expect(matchGlobsStub.getCall(0).args[1].suppressErrors).to.be.undefined
        expect(matchGlobsStub.getCall(1).args[1].suppressErrors).to.equal(true)
      })

      it('should return empty array if retry with suppression fails', async () => {
        matchGlobsStub.rejects(new Error('mocked filesystem error'))

        const files = await fileDataSource.getFilesByGlob(
          '/',
          '/cypress/e2e/**.cy.js',
          { absolute: false, objectMode: true },
        )

        expect(files).to.eql([])
        expect(matchGlobsStub).to.have.callCount(2)
      })
    })
  })
})
