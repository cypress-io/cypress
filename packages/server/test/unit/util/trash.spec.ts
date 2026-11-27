import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import trash from '../../../lib/util/trash'

const trashState = vi.hoisted(() => ({ stub: undefined as Mock | undefined }))

vi.mock('electron', () => {
  return {
    shell: {
      trashItem: (itemPath: string) => {
        return trashState.stub ? trashState.stub(itemPath) : fs.promises.rm(itemPath, { recursive: true })
      },
    },
  }
})

// Creates test directories and files for trash testing
const populateDirectories = async (basePath: string): Promise<void> => {
  await fs.promises.mkdir(basePath, { recursive: true })
  await fs.promises.mkdir(path.resolve(basePath, 'bar'), { recursive: true })
  await fs.promises.mkdir(path.resolve(basePath, 'bar', 'baz'), { recursive: true })

  await fs.promises.writeFile(path.resolve(basePath, 'a.txt'), '')
  await fs.promises.writeFile(path.resolve(basePath, 'bar', 'b.txt'), '')
  await fs.promises.writeFile(path.resolve(basePath, 'bar', 'baz', 'c.txt'), '')

  expect(fs.existsSync(path.resolve(basePath, 'a.txt'))).toBe(true)
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'b.txt'))).toBe(true)
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'baz', 'c.txt'))).toBe(true)
}

// Verifies that directories exist but their contents have been removed
const expectDirectoriesExist = (basePath: string): void => {
  expect(fs.existsSync(basePath)).toBe(true)
  expect(fs.existsSync(path.resolve(basePath, 'a.txt'))).toBe(false)
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'b.txt'))).toBe(false)
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'baz', 'c.txt'))).toBe(false)
}

describe('lib/util/trash', () => {
  let tempDir: string

  beforeEach(async () => {
    // some agent hosts set this, which would send every platform down the run-as-Node path
    vi.stubEnv('ELECTRON_RUN_AS_NODE', '')
    tempDir = path.join(os.tmpdir(), `cypress-test-${Date.now()}`)
    await fs.promises.mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    trashState.stub = undefined
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    await fs.promises.rm(tempDir, { recursive: true, force: true })
  })

  describe('.folder', () => {
    it('trashes contents of directory in non-Linux', async () => {
      vi.spyOn(os, 'platform').mockReturnValue('darwin')
      const basePath = path.join(tempDir, 'foo')

      await populateDirectories(basePath)

      await trash.folder(basePath)
      expectDirectoriesExist(basePath)
      await fs.promises.rmdir(basePath)
    })

    it('doesn\'t fail if directory is non-existent', async () => {
      await trash.folder(path.join(tempDir, 'bar'))
    })

    it('removes items on Windows when trashing fails because the Recycle Bin removes files immediately', async () => {
      vi.spyOn(os, 'platform').mockReturnValue('win32')
      const basePath = path.join(tempDir, 'foo')

      await populateDirectories(basePath)

      const trashStub = vi.fn().mockRejectedValue(new Error('Failed to perform delete operation'))

      trashState.stub = trashStub

      await trash.folder(basePath)
      expect(trashStub).toHaveBeenCalled()
      expectDirectoriesExist(basePath)
      await fs.promises.rmdir(basePath)
    })

    it('rethrows when trashing fails on macOS', async () => {
      vi.spyOn(os, 'platform').mockReturnValue('darwin')
      const basePath = path.join(tempDir, 'foo')

      await populateDirectories(basePath)

      trashState.stub = vi.fn().mockRejectedValue(new Error('Failed to move item to trash'))

      await expect(trash.folder(basePath)).rejects.toThrow('Failed to move item to trash')
      expect(fs.existsSync(path.resolve(basePath, 'a.txt'))).toBe(true)
      await fs.promises.rm(basePath, { recursive: true, force: true })
    })

    it('empties the directory without Electron\'s shell when running as Node', async () => {
      vi.spyOn(os, 'platform').mockReturnValue('darwin')
      vi.stubEnv('ELECTRON_RUN_AS_NODE', '1')
      const basePath = path.join(tempDir, 'foo')

      await populateDirectories(basePath)

      const trashStub = vi.fn()

      trashState.stub = trashStub

      await trash.folder(basePath)
      expect(trashStub).not.toHaveBeenCalled()
      expectDirectoriesExist(basePath)
      await fs.promises.rmdir(basePath)
    })

    it('completely removes directory on Linux', async () => {
      vi.spyOn(os, 'platform').mockReturnValue('linux')
      const basePath = path.join(tempDir, 'foo')

      await populateDirectories(basePath)

      await trash.folder(basePath)
      expectDirectoriesExist(basePath)
      await fs.promises.rmdir(basePath)
    })
  })
})
