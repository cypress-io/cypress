import { describe, expect, it, jest } from '@jest/globals'
import fs from 'fs-extra'
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
      })

      describe('#getFilesByGlob', () => {
        it('finds files at root matching given pattern using globby', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            'root-script-*.js',
          )

          expect(files).toHaveLength(2)
          expect(files[0]).toEqual(path.join(projectPath, 'root-script-1.js'))
          expect(files[1]).toEqual(path.join(projectPath, 'root-script-2.js'))
        })

        it('finds files matching relative patterns in working dir', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            './root-script-*.js',
          )

          expect(files).toHaveLength(2)
        })

        it('finds files matching patterns that include working dir', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            `${projectPath}/root-script-*.js`,
          )

          expect(files).toHaveLength(2)
        })

        it('does not replace working directory in glob pattern if it is not leading', async () => {
          // Create a redundant structure within the project dir matching its absolute path
          // and write a new script in that location
          const nestedScriptPath = path.join(projectPath, 'cypress', projectPath)

          await fs.mkdirs(nestedScriptPath)
          await fs.writeFile(path.join(nestedScriptPath, 'nested-script.js'), '')

          // Verify that the glob pattern is not impacted if it contains directories equivalent
          // to the working directory
          let files = await fileDataSource.getFilesByGlob(
            projectPath,
            `./cypress${projectPath}/nested-script.js`,
          )

          expect(files).toHaveLength(1)
        })

        it('finds files matching multiple patterns', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            ['root-script-*.js', 'scripts/**/*.js'],
          )

          expect(files).toHaveLength(5)
        })

        it('does not find files outside of working dir', async () => {
          const files = await fileDataSource.getFilesByGlob(
            scriptsFolder,
            ['root-script-*.js', './**/*.js'],
          )

          expect(files).toHaveLength(3)
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
          expect(files).toHaveLength(2)
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
          expect(files).toHaveLength(4)
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
          expect(files).toHaveLength(3)
        })

        it('converts globs to POSIX paths on windows', async () => {
          const windowsSeperator = '\\'

          jest.spyOn(os, 'platform').mockReturnValue('win32')

          const { toPosix: toPosixActual } = jest.requireActual<typeof import('../../../src/util/file')>('../../../src/util/file')

          jest.spyOn(fileUtil, 'toPosix').mockImplementation((path) => {
            return toPosixActual(path, windowsSeperator)
          })

          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            `**${windowsSeperator}*script-*.js`,
          )

          expect(files).toHaveLength(5)
        })

        it('finds files using given globby options', async () => {
          const files = await fileDataSource.getFilesByGlob(
            projectPath,
            'root-script-*.js',
            { absolute: false },
          )

          expect(files).toHaveLength(2)
          expect(files[0]).toEqual('root-script-1.js')
          expect(files[1]).toEqual('root-script-2.js')
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

      beforeEach(() => {
        jest.spyOn(FileDataSourceModule, 'matchGlobs').mockResolvedValue(mockMatches)
      })

      it('matches absolute patterns when working directory is root', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          '/cypress/e2e/**.cy.js',
        )

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
          ['cypress/e2e/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/' },
        )
      })

      it('matches relative patterns when working directory is root', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          './project/**.cy.js',
        )

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
          ['./project/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/' },
        )
      })

      it('matches implicit relative patterns when working directory is root', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/',
          'project/**.cy.js',
        )

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
          ['project/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/' },
        )
      })

      it('matches absolute patterns without including working dir in pattern', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/my/project',
          '/my/project/cypress/e2e/**.cy.js',
        )

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
          ['cypress/e2e/**.cy.js'],
          { ...defaultGlobbyOptions, cwd: '/my/project' },
        )
      })

      it('matches absolute patterns that include a copy of the working dir structure', async () => {
        const files = await fileDataSource.getFilesByGlob(
          '/my/project',
          '/my/project/cypress/my/project/e2e/**.cy.js',
        )

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
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

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
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

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
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

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
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

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
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

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledWith(
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
        jest.spyOn(FileDataSourceModule, 'matchGlobs')
        .mockReset()
        .mockImplementationOnce(() => {
          return Promise.reject(new Error('mocked filesystem error'))
        }).mockImplementationOnce(() => {
          return Promise.resolve(mockMatches)
        })

        const files = await fileDataSource.getFilesByGlob(
          '/',
          '/cypress/e2e/**.cy.js',
          { absolute: false, objectMode: true },
        )

        expect(files).toEqual(mockMatches)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledTimes(2)
        expect(FileDataSourceModule.matchGlobs).toHaveBeenNthCalledWith(1, expect.any(Array), expect.not.objectContaining({ suppressErrors: expect.any(Boolean) }))
        expect(FileDataSourceModule.matchGlobs).toHaveBeenNthCalledWith(2, expect.any(Array), expect.objectContaining({ suppressErrors: true }))
      })

      it('should return empty array if retry with suppression fails', async () => {
        jest.spyOn(FileDataSourceModule, 'matchGlobs')
        .mockReset()
        .mockImplementation(() => {
          return Promise.reject(new Error('mocked filesystem error'))
        })

        const files = await fileDataSource.getFilesByGlob(
          '/',
          '/cypress/e2e/**.cy.js',
          { absolute: false, objectMode: true },
        )

        expect(files).toEqual([])
        expect(FileDataSourceModule.matchGlobs).toHaveBeenCalledTimes(2)
      })
    })
  })
})
