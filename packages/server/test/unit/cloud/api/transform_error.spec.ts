import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installErrorTransform } from '../../../../lib/cloud/api/axios_middleware/transform_error'
import type { AxiosResponse, AxiosInstance } from 'axios'
import { AxiosError } from 'axios'

describe('transformError', () => {
  const status = 400
  const errorData = { message: 'this is an error message' }
  const expectedDataMessage = `${status}\n\n{
  "message": "this is an error message"
}`
  const originalMessage = 'an error occurred'
  let transformError: (err: AxiosError | Error & { error?: any, statusCode: number, isApiError?: boolean }) => never

  beforeEach(() => {
    const responseUse = vi.fn()
    const mockAxiosInstance: Partial<AxiosInstance> = {
      interceptors: {
        response: {
          use: responseUse,
          eject: vi.fn(),
          clear: vi.fn(),
        },
        request: {
          use: vi.fn(),
          eject: vi.fn(),
          clear: vi.fn(),
        },
      },
    }

    // @ts-expect-error
    installErrorTransform(mockAxiosInstance)

    const [, secondArg] = responseUse.mock.calls[0]

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
        expect(thrown).not.toBeUndefined()
        expect(thrown.message).toBe(expectedDataMessage)
        expect(thrown.isApiError).toBe(true)
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
        expect(thrown.message).toBe(err.message)
        expect(thrown.isApiError).toBe(true)
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
        expect(thrown).not.toBeUndefined()
        expect(thrown.message).toBe(expectedDataMessage)
        expect(thrown.isApiError).toBe(true)
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
        expect(thrown.message).toBe(err.message)
        expect(thrown.isApiError).toBe(true)
      })
    })
  })
})
