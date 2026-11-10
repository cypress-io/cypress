import type { ReadStream } from 'fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { putProtocolArtifact } from '../../../../lib/cloud/api/put_protocol_artifact'
import { HttpError } from '../../../../lib/cloud/network/http_error'

const stubs = vi.hoisted(() => {
  return {
    createReadStream: vi.fn(),
    stat: vi.fn(),
    putFetch: vi.fn(),
    // asyncRetry is already unit tested, no need to test retry behavior: identity stub
    asyncRetry: vi.fn((fn: (...args: any[]) => any) => fn),
    StreamActivityMonitor: vi.fn(),
  }
})

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()

  return {
    ...actual,
    createReadStream: stubs.createReadStream,
    default: { ...actual, createReadStream: stubs.createReadStream },
  }
})

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()

  return {
    ...actual,
    stat: stubs.stat,
    default: { ...actual, stat: stubs.stat },
  }
})

vi.mock('../../../../lib/cloud/network/fetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/network/fetch')>()

  return {
    ...actual,
    putFetch: stubs.putFetch,
  }
})

vi.mock('../../../../lib/util/async_retry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/util/async_retry')>()

  return {
    ...actual,
    asyncRetry: stubs.asyncRetry,
  }
})

vi.mock('../../../../lib/cloud/upload/stream_activity_monitor', () => {
  return {
    StreamActivityMonitor: stubs.StreamActivityMonitor,
  }
})

describe('putProtocolArtifact', () => {
  let filePath: string
  let maxFileSize: number
  let fileSize: number
  let uploadMonitorSamplingRate: number
  let mockReadStream: ReadStream
  let destinationUrl: string

  const putArtifact = putProtocolArtifact

  // `putProtocolArtifact` is built by calling `asyncRetry` at module load, so this
  // call record is captured once and must outlive the per-test mock resets below.
  const retryOptions = stubs.asyncRetry.mock.calls[0][1] as {
    maxAttempts: number
    retryDelay?: (attempt: number) => number
    shouldRetry?: (err?: any) => boolean
  }

  beforeEach(() => {
    maxFileSize = 20000
    filePath = '/some/file/path'
    fileSize = 20
    destinationUrl = 'https://some/destination/url'
    uploadMonitorSamplingRate = 10000

    mockReadStream = {} as ReadStream
    stubs.createReadStream.mockReset().mockReturnValue(mockReadStream)

    const mockStreamMonitor = {
      getController: vi.fn().mockReturnValue(new AbortController()),
      monitor: vi.fn(),
    }

    stubs.StreamActivityMonitor.mockReset().mockImplementation(() => mockStreamMonitor)

    stubs.putFetch.mockReset()
    stubs.stat.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('is wrapped with an asyncRetry', () => {
    expect(retryOptions.maxAttempts).toBe(3)
    expect(retryOptions.retryDelay).toBeTypeOf('function')
  })

  describe('shouldRetry', () => {
    let shouldRetry: (err: any) => boolean

    beforeEach(() => {
      shouldRetry = retryOptions.shouldRetry!
    })

    // The PUT method is idempotent, so isRetryableError also returns true
    // for HTTP 500 in addition to the always-retryable statuses.
    it('retries on HTTP 500 in addition to the always-retryable statuses', () => {
      const retryableStatuses = [408, 429, 500, 502, 503, 504]

      retryableStatuses.forEach((status) => {
        const err = new HttpError('some error', 'http://some/url', status, 'status text', '', new Response())

        expect(shouldRetry(err), `status ${status}`).toBe(true)
      })
    })

    it('does not retry on non-retryable HTTP errors', () => {
      const err = new HttpError('some error', 'http://some/url', 400, 'Bad Request', '', new Response())

      expect(shouldRetry(err)).toBe(false)
    })
  })

  describe('when provided an artifact path that does not exist', () => {
    let invalidPath: string

    beforeEach(() => {
      invalidPath = '/some/invalid/path'

      stubs.stat.mockImplementation((path: string) => {
        if (path !== invalidPath) {
          return Promise.reject(new Error(`unexpected stat path: ${path}`))
        }

        const e: NodeJS.ErrnoException = new Error(`ENOENT: no such file or directory, stat '${path}'`)

        e.errno = -2
        e.code = 'ENOENT'
        e.syscall = 'stat'
        e.path = path

        return Promise.reject(e)
      })
    })

    it('rejects with a file does not exist error', async () => {
      await expect(putArtifact(invalidPath, maxFileSize, destinationUrl, uploadMonitorSamplingRate))
      .rejects.toThrow(`ENOENT: no such file or directory, stat '/some/invalid/path'`)
    })
  })

  describe('when provided a valid artifact path', () => {
    beforeEach(() => {
      stubs.stat.mockImplementation((path: string) => {
        if (path !== filePath) {
          return Promise.reject(new Error(`unexpected stat path: ${path}`))
        }

        return Promise.resolve({ size: fileSize })
      })
    })

    describe('and the artifact is too large', () => {
      beforeEach(() => {
        maxFileSize = fileSize - 1
      })

      it('rejects with a file too large error', async () => {
        await expect(putArtifact(filePath, maxFileSize, destinationUrl, uploadMonitorSamplingRate))
        .rejects.toThrow('Spec recording too large: artifact is 20 bytes, limit is 19 bytes')
      })
    })

    describe('and fetch completes successfully', () => {
      beforeEach(() => {
        stubs.putFetch.mockResolvedValue(undefined)
      })

      it('creates the stream activity monitor with the provided sampling interval and resolves', async () => {
        await expect(putArtifact(filePath, maxFileSize, destinationUrl, uploadMonitorSamplingRate)).resolves.toBeUndefined()

        expect(stubs.StreamActivityMonitor).toHaveBeenCalledWith(uploadMonitorSamplingRate)
      })
    })

    describe('and putFetch rejects', () => {
      let httpErr: HttpError
      let res: Response

      beforeEach(() => {
        res = new Response()

        httpErr = new HttpError(
          `403 Forbidden (${destinationUrl})`,
          destinationUrl,
          403,
          'Forbidden',
          'Response Body',
          res,
        )

        stubs.putFetch.mockRejectedValue(httpErr)
      })

      it('rethrows', async () => {
        let error: Error | undefined

        try {
          await putArtifact(filePath, maxFileSize, destinationUrl, uploadMonitorSamplingRate)
        } catch (e) {
          error = e as Error
        }

        expect(error).toBe(httpErr)
      })
    })
  })
})
