import fs from 'fs'
import os from 'os'
import path from 'path'
import trash from '../../../lib/util/trash'
import sinon from 'sinon'
import { expect } from 'chai'

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

    it('completely removes directory on Linux', async () => {
      sinon.stub(os, 'platform').returns('linux')
      const basePath = path.join(tempDir, 'foo')

      populateDirectories(basePath)

      await trash.folder(basePath)
      expectDirectoriesExist(basePath)
      fs.rmdirSync(basePath)
    })
  })
})
