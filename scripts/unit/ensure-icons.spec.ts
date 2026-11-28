import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitUntilExists } from '../ensure-icons'

describe('waitUntilExists', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ensure-icons-'))
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('resolves without logging when the path already exists', async () => {
    await waitUntilExists(tmpDir, { freq: 1, maxAttempts: 3 })

    expect(console.log).not.toHaveBeenCalled()
  })

  it('resolves once the path appears on a later attempt', async () => {
    const favicon = path.join(tmpDir, 'favicon')

    vi.spyOn(fs, 'access')
    .mockRejectedValueOnce(Object.assign(new Error(`ENOENT: no such file or directory, access '${favicon}'`), { code: 'ENOENT' }))
    .mockResolvedValueOnce(undefined)

    await expect(waitUntilExists(favicon, { freq: 1, maxAttempts: 3 })).resolves.toBeUndefined()

    expect(fs.access).toHaveBeenCalledTimes(2)
    expect(console.log).toHaveBeenCalledTimes(1)
  })

  it('checks exactly maxAttempts times before failing', async () => {
    const favicon = path.join(tmpDir, 'favicon')

    await expect(waitUntilExists(favicon, { freq: 1, maxAttempts: 3 }))
    .rejects.toThrow(`Failed to detect path at ${favicon} after 3 attempts.`)

    expect(vi.mocked(console.log).mock.calls.map(([message]) => message)).toEqual([
      `[scripts/ensure-icons]: ${favicon} not found. Will check again in 1ms. Attempt: 1/3`,
      `[scripts/ensure-icons]: ${favicon} not found. Will check again in 1ms. Attempt: 2/3`,
    ])
  })

  // Stubbed because no real filesystem setup gives the same non-ENOENT error on every
  // platform: Windows reports a path through a regular file as ENOENT, not ENOTDIR
  it('rethrows errors other than a missing path instead of retrying', async () => {
    const favicon = path.join(tmpDir, 'favicon')

    vi.spyOn(fs, 'access').mockRejectedValue(Object.assign(new Error(`EACCES: permission denied, access '${favicon}'`), { code: 'EACCES' }))

    await expect(waitUntilExists(favicon, { freq: 1, maxAttempts: 3 }))
    .rejects.toMatchObject({ code: 'EACCES' })

    expect(fs.access).toHaveBeenCalledTimes(1)
    expect(console.log).not.toHaveBeenCalled()
  })
})
