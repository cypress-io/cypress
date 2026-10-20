import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renameAtomicWithRetry } from '../../../lib/cloud/extract_atomic'

const stubs = vi.hoisted(() => {
  return {
    ensureDir: vi.fn(async () => {}),
    rename: vi.fn(),
  }
})

vi.mock('fs-extra', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs-extra')>()
  const overrides = { ensureDir: stubs.ensureDir, rename: stubs.rename }

  return { ...actual, ...overrides, default: { ...actual, ...overrides } }
})

describe('renameAtomicWithRetry', () => {
  const renameStub = stubs.rename

  beforeEach(() => {
    renameStub.mockReset()
  })

  it('should rename once when the operation succeeds', async () => {
    renameStub.mockResolvedValue(undefined)

    await renameAtomicWithRetry('/src/file', '/dst/file')

    expect(renameStub).toHaveBeenCalledOnce()
    expect(renameStub).toHaveBeenCalledWith('/src/file', '/dst/file')
  })

  it('should retry on EPERM and succeed on a subsequent attempt', async () => {
    const epermError = Object.assign(new Error('EPERM: operation not permitted, rename'), { code: 'EPERM' })

    renameStub.mockRejectedValueOnce(epermError)
    renameStub.mockResolvedValueOnce(undefined)

    await renameAtomicWithRetry('/src/file', '/dst/file')

    expect(renameStub).toHaveBeenCalledTimes(2)
  })

  it('should retry on EACCES and succeed on a subsequent attempt', async () => {
    const eaccesError = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })

    renameStub.mockRejectedValueOnce(eaccesError)
    renameStub.mockResolvedValueOnce(undefined)

    await renameAtomicWithRetry('/src/file', '/dst/file')

    expect(renameStub).toHaveBeenCalledTimes(2)
  })

  it('should retry on EBUSY (Windows: file in use by AV / another process) and succeed on a subsequent attempt', async () => {
    const ebusyError = Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' })

    renameStub.mockRejectedValueOnce(ebusyError)
    renameStub.mockResolvedValueOnce(undefined)

    await renameAtomicWithRetry('/src/file', '/dst/file')

    expect(renameStub).toHaveBeenCalledTimes(2)
  })

  it('should throw the last error when EPERM persists past the retry budget', async () => {
    const epermError = Object.assign(new Error('EPERM: operation not permitted, rename'), { code: 'EPERM' })

    renameStub.mockRejectedValue(epermError)

    await expect(renameAtomicWithRetry('/src/file', '/dst/file')).rejects.toBe(epermError)
    // MAX_RETRIES = 3, so 4 total attempts (initial + 3 retries)
    expect(renameStub).toHaveBeenCalledTimes(4)
  })

  it('should not retry on non-retryable errors such as ENOENT', async () => {
    const enoentError = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })

    renameStub.mockRejectedValue(enoentError)

    await expect(renameAtomicWithRetry('/src/file', '/dst/file')).rejects.toBe(enoentError)
    expect(renameStub).toHaveBeenCalledOnce()
  })

  it('should not retry on errors without an EPERM/EACCES code', async () => {
    const opaqueError = new Error('something else went wrong')

    renameStub.mockRejectedValue(opaqueError)

    await expect(renameAtomicWithRetry('/src/file', '/dst/file')).rejects.toBe(opaqueError)
    expect(renameStub).toHaveBeenCalledOnce()
  })
})
