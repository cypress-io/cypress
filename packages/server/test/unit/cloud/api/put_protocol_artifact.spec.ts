import { PassThrough } from 'stream'
import { ReadStream } from 'fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { putProtocolArtifact } from '../../../../lib/cloud/api/put_protocol_artifact'
import { HttpError } from '../../../../lib/cloud/network/http_error'
import { isRetryableError } from '../../../../lib/cloud/network/is_retryable_error'

const stubs = vi.hoisted(() => {
  const putFetchStub = vi.fn()
  const createReadStream = vi.fn()
  const stat = vi.fn()
  const asyncRetryMock = vi.fn((fn: (...args: unknown[]) => unknown) => fn)
  const StreamActivityMonitorCtor = vi.fn()

  return {
    putFetchStub,
    createReadStream,
    stat,
    asyncRetryMock,
    StreamActivityMonitorCtor,
  }
})

vi.mock('fs', () => {
  return {
    default: {
      createReadStream: stubs.createReadStream,
    },
  }
})

vi.mock('fs/promises', () => {
  return {
    default: {
      stat: stubs.stat,
    },
  }
})

vi.mock('../../../../lib/cloud/network/fetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/network/fetch')>()

  return {
    ...actual,
    putFetch: stubs.putFetchStub,
  }
})

vi.mock('../../../../lib/util/async_retry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/util/async_retry')>()

  return {
    ...actual,
    asyncRetry: stubs.asyncRetryMock,
  }
})

vi.mock('../../../../lib/cloud/upload/stream_activity_monitor', () => {
  return {
    StreamActivityMonitor: stubs.StreamActivityMonitorCtor,
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

  beforeEach(() => {
    stubs.putFetchStub.mockReset()
    stubs.asyncRetryMock.mockImplementation((fn) => fn)
    stubs.StreamActivityMonitorCtor.mockReset()

    maxFileSize = 20000
    filePath = '/some/file/path'
    fileSize = 20
    destinationUrl = 'https://some/destination/url'
    uploadMonitorSamplingRate = 10000

    mockReadStream = {} as ReadStream
    stubs.createReadStream.mockReturnValue(mockReadStream)

    const mockStreamMonitor = {
      getController: vi.fn().mockReturnValue(new AbortController()),
      monitor: vi.fn().mockReturnValue(new PassThrough()),
    }

    stubs.StreamActivityMonitorCtor.mockImplementation(() => mockStreamMonitor)

    stubs.stat.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('is wrapped with an asyncRetry', () => {
    const options = stubs.asyncRetryMock.mock.calls[0][1]

    expect(options.maxAttempts).toBe(3)
    expect(typeof options.retryDelay).toBe('function')
    expect(options.shouldRetry).toBe(isRetryableError)
  })

  describe('when provided an artifact path that does not exist', () => {
    let invalidPath: string

    beforeEach(() => {
      invalidPath = '/some/invalid/path'

      stubs.stat.mockImplementation((path: string) => {
        const e = new Error(`ENOENT: no such file or directory, stat '${path}'`) as NodeJS.ErrnoException

        e.errno = -2
        e.code = 'ENOENT'
        e.syscall = 'stat'
        e.path = path

        return Promise.reject(e)
      })
    })

    it('rejects with a file does not exist error', async () => {
      await expect(
        putArtifact(invalidPath, maxFileSize, destinationUrl, uploadMonitorSamplingRate),
      ).rejects.toThrow(`ENOENT: no such file or directory, stat '/some/invalid/path'`)
    })
  })

  describe('when provided a valid artifact path', () => {
    beforeEach(() => {
      stubs.stat.mockImplementation((path: string) => {
        if (path === filePath) {
          return Promise.resolve({ size: fileSize })
        }

        return Promise.reject(new Error('unexpected stat path'))
      })
    })

    describe('and the artifact is too large', () => {
      beforeEach(() => {
        maxFileSize = fileSize - 1
      })

      it('rejects with a file too large error', async () => {
        await expect(
          putArtifact(filePath, maxFileSize, destinationUrl, uploadMonitorSamplingRate),
        ).rejects.toThrow('Spec recording too large: artifact is 20 bytes, limit is 19 bytes')
      })
    })

    describe('and fetch completes successfully', () => {
      beforeEach(() => {
        stubs.putFetchStub.mockResolvedValue(undefined)
      })

      it('creates the stream activity monitor with the provided sampling interval and resolves', async () => {
        await expect(
          putArtifact(filePath, maxFileSize, destinationUrl, uploadMonitorSamplingRate),
        ).resolves.toBeUndefined()

        expect(stubs.StreamActivityMonitorCtor).toHaveBeenCalledWith(uploadMonitorSamplingRate)
      })
    })

    describe('and putFetch rejects', () => {
      let httpErr: HttpError
      let res: Response

      beforeEach(() => {
        res = new Response('Response Body', { status: 403, statusText: 'Forbidden' })

        httpErr = new HttpError(
          `403 Forbidden (${destinationUrl})`,
          destinationUrl,
          403,
          'Forbidden',
          'Response Body',
          res,
        )

        stubs.putFetchStub.mockRejectedValue(httpErr)
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
