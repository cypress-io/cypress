import fs from 'fs'
import os from 'os'
import path from 'path'
import trash from '../../../lib/util/trash'
import sinon from 'sinon'
import { expect } from 'chai'
import { proxyquire } from '../../spec_helper'

require('../../spec_helper')

// Creates test directories and files for trash testing
const populateDirectories = async (basePath: string): Promise<void> => {
  await fs.promises.mkdir(basePath, { recursive: true })
  await fs.promises.mkdir(path.resolve(basePath, 'bar'), { recursive: true })
  await fs.promises.mkdir(path.resolve(basePath, 'bar', 'baz'), { recursive: true })

  await fs.promises.writeFile(path.resolve(basePath, 'a.txt'), '')
  await fs.promises.writeFile(path.resolve(basePath, 'bar', 'b.txt'), '')
  await fs.promises.writeFile(path.resolve(basePath, 'bar', 'baz', 'c.txt'), '')

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

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `cypress-test-${Date.now()}`)
    await fs.promises.mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true })
  })

  context('.folder', () => {
    it('trashes contents of directory in non-Linux', async () => {
      sinon.stub(os, 'platform').returns('darwin')
      const basePath = path.join(tempDir, 'foo')

      await populateDirectories(basePath)

      await trash.folder(basePath)
      expectDirectoriesExist(basePath)
      await fs.promises.rmdir(basePath)
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

      await populateDirectories(basePath)

      const trashStub = sinon.stub().callsFake(async (paths: string[]) => {
        // the underlying implementation removes the items...
        await Promise.all(paths.map((p) => fs.promises.rm(p, { recursive: true, force: true })))
        // ...but then rejects with a non-zero exit error
        throw new Error('Command failed: windows-trash.exe')
      })

      const trashModule = proxyquire(path.resolve(__dirname, '../../../lib/util/trash'), {
        trash: trashStub,
      })

      await trashModule.folder(basePath)
      expect(trashStub).to.have.been.called
      expectDirectoriesExist(basePath)
      await fs.promises.rmdir(basePath)
    })

    it('rethrows when trash fails and the item still exists', async () => {
      sinon.stub(os, 'platform').returns('win32')
      const basePath = path.join(tempDir, 'foo')

      await populateDirectories(basePath)

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
      await fs.promises.rm(basePath, { recursive: true, force: true })
    })

    it('completely removes directory on Linux', async () => {
      sinon.stub(os, 'platform').returns('linux')
      const basePath = path.join(tempDir, 'foo')

      await populateDirectories(basePath)

      await trash.folder(basePath)
      expectDirectoriesExist(basePath)
      await fs.promises.rmdir(basePath)
    })
  })
})
