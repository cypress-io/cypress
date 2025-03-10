import { expect } from 'chai'
import { installErrorTransform } from '../../../../lib/cloud/api/axios_middleware/transform_error'
import { AxiosError, AxiosResponse, AxiosInstance } from 'axios'
import sinon, { SinonSpy } from 'sinon'

describe('transformError', () => {
  const status = 400
  const errorData = { message: 'this is an error message' }
  const expectedDataMessage = `${status}\n\n{
  "message": "this is an error message"
}`
  const originalMessage = 'an error occurred'
  let transformError: (err: AxiosError | Error & { error?: any, statusCode: number, isApiError?: boolean }) => never

  beforeEach(() => {
    const mockAxiosInstance: Partial<AxiosInstance> = {
      interceptors: {
        response: {
          use: sinon.spy(),
          eject: sinon.spy(),
          clear: sinon.spy(),
        },
        request: {
          use: sinon.spy(),
          eject: sinon.spy(),
          clear: sinon.spy(),
        },
      },
    }

    // @ts-expect-error
    installErrorTransform(mockAxiosInstance)

    const [, secondArg] = (mockAxiosInstance.interceptors?.response.use as SinonSpy).firstCall.args

    transformError = secondArg
  })

  describe('when it receives an axios error', () => {
    let err: AxiosError

    beforeEach(() => {
      err = new AxiosError(originalMessage)
      err.status = status
    })

    describe('and the response has object data', () => {
      beforeEach(() => {
        err.response = { data: errorData } as AxiosResponse
      })

      it('throws an error with the expected message', () => {
        let thrown

        try {
          transformError(err)
        } catch (e) {
          thrown = e
        }
        expect(thrown).not.to.be.undefined
        expect(thrown.message).to.eq(expectedDataMessage)
        expect(thrown.isApiError).to.be.true
      })
    })

    describe('and the response does not have object data', () => {
      it('re-throws the original error', () => {
        let thrown

        try {
          transformError(err)
        } catch (e) {
          thrown = e
        }
        expect(thrown.message).to.eq(err.message)
        expect(thrown.isApiError).to.be.true
      })
    })
  })

  describe('when it receives a @cypress/request error', () => {
    let err: Error & { error?: any, statusCode: number }

    beforeEach(() => {
      // @ts-expect-error
      err = new Error(originalMessage)
      err.statusCode = status
    })

    describe('and that error has an object response', () => {
      beforeEach(() => {
        err.error = errorData
      })

      it('throws an error with a formatted message', () => {
        let thrown

        try {
          transformError(err)
        } catch (e) {
          thrown = e
        }
        expect(thrown).to.not.be.undefined
        expect(thrown.message).to.eq(expectedDataMessage)
        expect(thrown.isApiError).to.be.true
      })
    })

    describe('and the response does not have object data', () => {
      it('re-throws the original error', () => {
        let thrown

        try {
          transformError(err)
        } catch (e) {
          thrown = e
        }
        expect(thrown.message).to.eq(err.message)
        expect(thrown.isApiError).to.be.true
      })
    })
  })
})
