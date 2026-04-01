import { installErrorTransform } from '../../../../lib/cloud/api/axios_middleware/transform_error'
import { AxiosError, AxiosResponse, AxiosInstance } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    const requestUse = vi.fn()

    const mockAxiosInstance: Partial<AxiosInstance> = {
      interceptors: {
        response: {
          use: responseUse,
          eject: vi.fn(),
          clear: vi.fn(),
        },
        request: {
          use: requestUse,
          eject: vi.fn(),
          clear: vi.fn(),
        },
      },
    }

    // @ts-expect-error partial mock
    installErrorTransform(mockAxiosInstance as AxiosInstance)

    const [, secondArg] = responseUse.mock.calls[0] as [unknown, typeof transformError]

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
        let thrown: Error | undefined

        try {
          transformError(err)
        } catch (e) {
          thrown = e as Error
        }

        expect(thrown).toBeDefined()
        expect(thrown!.message).toBe(expectedDataMessage)
        expect((thrown as Error & { isApiError?: boolean }).isApiError).toBe(true)
      })
    })

    describe('and the response does not have object data', () => {
      it('re-throws the original error', () => {
        let thrown: Error | undefined

        try {
          transformError(err)
        } catch (e) {
          thrown = e as Error
        }

        expect(thrown!.message).toBe(err.message)
        expect((thrown as Error & { isApiError?: boolean }).isApiError).toBe(true)
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
        let thrown: Error | undefined

        try {
          transformError(err)
        } catch (e) {
          thrown = e as Error
        }

        expect(thrown).toBeDefined()
        expect(thrown!.message).toBe(expectedDataMessage)
        expect((thrown as Error & { isApiError?: boolean }).isApiError).toBe(true)
      })
    })

    describe('and the response does not have object data', () => {
      it('re-throws the original error', () => {
        let thrown: Error | undefined

        try {
          transformError(err)
        } catch (e) {
          thrown = e as Error
        }

        expect(thrown!.message).toBe(err.message)
        expect((thrown as Error & { isApiError?: boolean }).isApiError).toBe(true)
      })
    })
  })
})
