import sinon from 'sinon'
import fs from 'fs-extra'
import { expect } from 'chai'
import path from 'path'
import os from 'os'

import { scaffoldProject, removeProject, createTestDataContext } from '../helper'
import { FileDataSource } from '../../../src/sources/FileDataSource'
import { DataContext } from '../../../src'
import * as fileUtil from '../../../src/util/file'

describe('FileDataSource', () => {
  let projectPath: string
  let scriptsFolder: string
  let ctx: DataContext
  let fileDataSource: FileDataSource

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
      const nestedScriptPath = path.join(projectPath, 'cypress', projectPath)

      await fs.mkdirs(nestedScriptPath)
      await fs.writeFile(path.join(nestedScriptPath, 'nested-script.js'), '')

      // Verify that the glob pattern is not impacted if if contains directories equivalent
      // to the working directory
      let files = await fileDataSource.getFilesByGlob(
        projectPath,
        `./cypress/${projectPath}/nested-script.js`,
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

    it('always ignores files within node_modules', async () => {
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
  })
})
