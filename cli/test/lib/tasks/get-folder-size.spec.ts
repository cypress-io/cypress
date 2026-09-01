import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import getFolderSize from '../../../lib/tasks/get-folder-size'

describe('lib/tasks/get-folder-size', function () {
  let root: string

  beforeEach(async function () {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'cypress-folder-size-'))
  })

  afterEach(async function () {
    await fs.remove(root)
  })

  it('returns the size of a single file', async function () {
    const file = path.join(root, 'a.txt')

    await fs.writeFile(file, 'abcde')

    await expect(getFolderSize(file)).resolves.toBe(5)
  })

  it('returns 0 for an empty folder', async function () {
    await expect(getFolderSize(root)).resolves.toBe(0)
  })

  it('sums every file in a folder', async function () {
    await fs.writeFile(path.join(root, 'a.txt'), 'a')
    await fs.writeFile(path.join(root, 'b.txt'), 'bb')
    await fs.writeFile(path.join(root, 'c.txt'), 'ccc')

    await expect(getFolderSize(root)).resolves.toBe(6)
  })

  it('recurses into nested folders', async function () {
    await fs.writeFile(path.join(root, 'a.txt'), 'a')
    await fs.outputFile(path.join(root, 'nested', 'b.txt'), 'bb')
    await fs.outputFile(path.join(root, 'nested', 'deeper', 'c.txt'), 'cccc')

    await expect(getFolderSize(root)).resolves.toBe(7)
  })

  it('measures the link itself rather than its target', async function () {
    const target = path.join(root, 'target.txt')

    await fs.writeFile(target, 'a'.repeat(1024))
    await fs.symlink(target, path.join(root, 'link'))

    const size = await getFolderSize(root)

    expect(size).toBeGreaterThan(1024)
    expect(size).toBeLessThan(1024 * 2)
  })
})
