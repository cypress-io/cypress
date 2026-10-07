import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HttpError } from '../../../../lib/cloud/network/http_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'
import { StreamStalledError } from '../../../../lib/cloud/upload/stream_stalled_error'
import { printProtocolUploadError as print } from '../../../../lib/cloud/artifacts/print_protocol_upload_error'

const { stubbedErrorWarning } = vi.hoisted(() => {
  return { stubbedErrorWarning: vi.fn() }
})

vi.mock('../../../../lib/errors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/errors')>()

  return {
    ...actual,
    warning: stubbedErrorWarning,
  }
})

describe('printProtocolUploadError', () => {
  beforeEach(() => {
    stubbedErrorWarning.mockReset()
  })

  describe('when passed an aggregate error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_AGGREGATE_ERROR message', () => {
      const error: Error & { errors?: Error[] } = new Error('message')

      error.errors = []
      print(error)
      expect(stubbedErrorWarning).toHaveBeenCalledWith('CLOUD_PROTOCOL_UPLOAD_AGGREGATE_ERROR', error)
    })
  })

  describe('when passed an http error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_HTTP_FAILURE', () => {
      const error = new HttpError('Service Unavailable', 'http://some.url', 503, 'Service Unavailable', '', {} as Response)

      print(error)
      expect(stubbedErrorWarning).toHaveBeenCalledWith('CLOUD_PROTOCOL_UPLOAD_HTTP_FAILURE', error)
    })
  })

  describe('when passed a system error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_NETWORK_FAILURE warning', () => {
      const err = new SystemError(new Error('msg'), 'http://some.url', 'ECONNRESET', 101)

      print(err)
      expect(stubbedErrorWarning).toHaveBeenCalledWith('CLOUD_PROTOCOL_UPLOAD_NETWORK_FAILURE', err)
    })
  })

  describe('when passed a stream stalled error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_STREAM_STALL_FAILURE warning', () => {
      const err = new StreamStalledError(5000, 64 * 1024)

      print(err)
      expect(stubbedErrorWarning).toHaveBeenCalledWith('CLOUD_PROTOCOL_UPLOAD_STREAM_STALL_FAILURE', err)
    })
  })

  describe('when passed some other kind of error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_UNKNOWN_ERROR warning', () => {
      const err = new Error('message')

      print(err)
      expect(stubbedErrorWarning).toHaveBeenCalledWith('CLOUD_PROTOCOL_UPLOAD_UNKNOWN_ERROR', err)
    })
  })
})
