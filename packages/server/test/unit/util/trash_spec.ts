import fs from 'fs'
import os from 'os'
import path from 'path'
import trash from '../../../lib/util/trash'
import sinon from 'sinon'
import { expect } from 'chai'
import { proxyquire } from '../../spec_helper'

require('../../spec_helper')

// Creates test directories and files for trash testing
const populateDirectories = (basePath: string): void => {
  fs.mkdirSync(basePath, { recursive: true })
  fs.mkdirSync(path.resolve(basePath, 'bar'), { recursive: true })
  fs.mkdirSync(path.resolve(basePath, 'bar', 'baz'), { recursive: true })

  fs.writeFileSync(path.resolve(basePath, 'a.txt'), '')
  fs.writeFileSync(path.resolve(basePath, 'bar', 'b.txt'), '')
  fs.writeFileSync(path.resolve(basePath, 'bar', 'baz', 'c.txt'), '')

  expect(fs.existsSync(path.resolve(basePath, 'a.txt'))).to.be.true
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'b.txt'))).to.be.true
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'baz', 'c.txt'))).to.be.true
}

// Verifies that directories exist but their contents have been removed
const expectDirectoriesExist = (basePath: string): void => {
  expect(fs.existsSync(basePath)).to.be.true
  expect(fs.existsSync(path.resolve(basePath, 'a.txt'))).to.be.false
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'b.txt'))).to.be.false
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'baz', 'c.txt'))).to.be.false
}

describe('lib/util/trash', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `cypress-test-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  context('.folder', () => {
    it('trashes contents of directory in non-Linux', async () => {
      sinon.stub(os, 'platform').returns('darwin')
      const basePath = path.join(tempDir, 'foo')

      populateDirectories(basePath)

      await trash.folder(basePath)
      expectDirectoriesExist(basePath)
      fs.rmdirSync(basePath)
    })

    it('doesn\'t fail if directory is non-existent', async () => {
      await trash.folder(path.join(tempDir, 'bar'))
    })

    it('does not throw when trash reports a failure but the item was actually removed', async () => {
      // Simulates the Windows behavior where the Recycle Bin is set to
      // "Don't move files to the Recycle Bin. Remove files immediately when
      // deleted." In that case windows-trash.exe deletes the file but exits
      // with a non-zero code, which `trash` surfaces as a rejection. See
      // https://github.com/cypress-io/cypress/issues/32691
      sinon.stub(os, 'platform').returns('win32')
      const basePath = path.join(tempDir, 'foo')

      populateDirectories(basePath)

      const trashStub = sinon.stub().callsFake(async (paths: string[]) => {
        // the underlying implementation removes the items...
        paths.forEach((p) => fs.rmSync(p, { recursive: true, force: true }))
        // ...but then rejects with a non-zero exit error
        throw new Error('Command failed: windows-trash.exe')
      })

      const trashModule = proxyquire(path.resolve(__dirname, '../../../lib/util/trash'), {
        trash: trashStub,
      })

      await trashModule.folder(basePath)
      expect(trashStub).to.have.been.called
      expectDirectoriesExist(basePath)
      fs.rmdirSync(basePath)
    })

    it('rethrows when trash fails and the item still exists', async () => {
      sinon.stub(os, 'platform').returns('win32')
      const basePath = path.join(tempDir, 'foo')

      populateDirectories(basePath)

      const trashStub = sinon.stub().rejects(new Error('Command failed: windows-trash.exe'))

      const trashModule = proxyquire(path.resolve(__dirname, '../../../lib/util/trash'), {
        trash: trashStub,
      })

      let thrown: Error | undefined

      try {
        await trashModule.folder(basePath)
      } catch (err) {
        thrown = err as Error
      }

      expect(thrown).to.be.an('error')
      fs.rmSync(basePath, { recursive: true, force: true })
    })

    it('completely removes directory on Linux', async () => {
      sinon.stub(os, 'platform').returns('linux')
      const basePath = path.join(tempDir, 'foo')

      populateDirectories(basePath)

      await trash.folder(basePath)
      expectDirectoriesExist(basePath)
      fs.rmdirSync(basePath)
    })
  })

  context('.wouldTrashProjectRoot', () => {
    // Guards against https://github.com/cypress-io/cypress/issues/26393, where a
    // misconfigured assets folder resolves to the project root (or an ancestor)
    // and trashing it wipes the whole project. These are pure path checks, so no
    // directories need to exist on disk.
    let projectRoot: string

    beforeEach(() => {
      projectRoot = path.join(tempDir, 'my-project')
    })

    it('returns true when the folder is the project root (e.g. downloadsFolder: "")', () => {
      expect(trash.wouldTrashProjectRoot(projectRoot, projectRoot)).to.be.true
    })

    it('returns true when the folder is the parent of the project root (e.g. downloadsFolder: "../")', () => {
      expect(trash.wouldTrashProjectRoot(path.resolve(projectRoot, '..'), projectRoot)).to.be.true
    })

    it('returns true when the folder is a distant ancestor of the project root', () => {
      expect(trash.wouldTrashProjectRoot(path.resolve(projectRoot, '..', '..'), projectRoot)).to.be.true
    })

    it('returns false for a folder nested inside the project root', () => {
      expect(trash.wouldTrashProjectRoot(path.join(projectRoot, 'cypress', 'downloads'), projectRoot)).to.be.false
    })

    it('returns false for a child folder whose name starts with ".."', () => {
      expect(trash.wouldTrashProjectRoot(path.join(projectRoot, '..downloads'), projectRoot)).to.be.false
    })

    it('returns false for a sibling folder outside the project root', () => {
      expect(trash.wouldTrashProjectRoot(path.resolve(projectRoot, '..', 'other-downloads'), projectRoot)).to.be.false
    })

    it('returns false for an unrelated absolute path', () => {
      expect(trash.wouldTrashProjectRoot(path.resolve(tempDir, 'somewhere', 'else'), path.join(tempDir, 'project'))).to.be.false
    })
  })
})
