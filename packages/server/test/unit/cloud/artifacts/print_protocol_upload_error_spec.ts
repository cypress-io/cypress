import { proxyquire, expect } from '../../../spec_helper'
import sinon from 'sinon'
import { HttpError } from '../../../../lib/cloud/network/http_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'
import { StreamStalledError } from '../../../../lib/cloud/upload/stream_stalled_error'
import type { warning } from '../../../../lib/errors'
import type { printProtocolUploadError } from '../../../../lib/cloud/artifacts/print_protocol_upload_error'

describe('printProtocolUploadError', () => {
  let stubbedErrorWarning: sinon.SinonStub<Parameters<typeof warning>, ReturnType<typeof warning>>

  let print: typeof printProtocolUploadError

  beforeEach(() => {
    stubbedErrorWarning = sinon.stub<Parameters<typeof warning>, ReturnType<typeof warning>>()
    const importPrintProtocolUploadError = proxyquire('../lib/cloud/artifacts/print_protocol_upload_error', {
      '../../errors': {
        warning: stubbedErrorWarning,
      },
    })

    print = importPrintProtocolUploadError.printProtocolUploadError
  })

  describe('when passed an aggregate error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_AGGREGATE_ERROR message', () => {
      const error: Error & { errors?: Error[] } = new Error('message')

      error.errors = []
      print(error)
      expect(stubbedErrorWarning).to.have.been.calledWith('CLOUD_PROTOCOL_UPLOAD_AGGREGATE_ERROR', error)
    })
  })

  describe('when passed an http error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_HTTP_FAILURE', () => {
      const error = new HttpError('Service Unavailable', 'http://some.url', 503, 'Service Unavailable', '', {} as Response)

      print(error)
      expect(stubbedErrorWarning).to.have.been.calledWith('CLOUD_PROTOCOL_UPLOAD_HTTP_FAILURE', error)
    })
  })

  describe('when passed a system error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_NETWORK_FAILURE warning', () => {
      const err = new SystemError(new Error('msg'), 'http://some.url')

      print(err)
      expect(stubbedErrorWarning).to.have.been.calledWith('CLOUD_PROTOCOL_UPLOAD_NETWORK_FAILURE', err)
    })
  })

  describe('when passed a stream stalled error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_STREAM_STALL_FAILURE warning', () => {
      const err = new StreamStalledError(5000, 64 * 1024)

      print(err)
      expect(stubbedErrorWarning).to.have.been.calledWith('CLOUD_PROTOCOL_UPLOAD_STREAM_STALL_FAILURE', err)
    })
  })

  describe('when passed some other kind of error', () => {
    it('prints a CLOUD_PROTOCOL_UPLOAD_UNKNOWN_ERROR warning', () => {
      const err = new Error('message')

      print(err)
      expect(stubbedErrorWarning).to.have.been.calledWith('CLOUD_PROTOCOL_UPLOAD_UNKNOWN_ERROR', err)
    })
  })
})
