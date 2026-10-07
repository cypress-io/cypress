import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reportStudioError } from '@packages/server/lib/cloud/api/studio/report_studio_error'
import { START_TAG, END_TAG } from '@packages/stderr-filtering'

describe('lib/cloud/api/studio/report_studio_error', () => {
  let cloudRequestStub: Mock
  let cloudApi: any
  let oldNodeEnv: string | undefined

  beforeEach(() => {
    oldNodeEnv = process.env.NODE_ENV
    cloudRequestStub = vi.fn()
    cloudApi = {
      cloudUrl: 'http://localhost:1234',
      cloudHeaders: { 'x-cypress-version': '1.2.3' },
      CloudRequest: {
        post: cloudRequestStub,
      },
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.CYPRESS_CRASH_REPORTS
    delete process.env.CYPRESS_DISABLE_GUEST_TELEMETRY
    delete process.env.CYPRESS_LOCAL_STUDIO_PATH
    delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
    if (oldNodeEnv) {
      process.env.NODE_ENV = oldNodeEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  describe('reportStudioError', () => {
    it('logs error when CYPRESS_LOCAL_STUDIO_PATH is set', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/studio'
      const error = new Error('test error')

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        START_TAG,
        'Error in testMethod:',
        error,
        END_TAG,
      )
    })

    it('logs error when NODE_ENV is development', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      process.env.NODE_ENV = 'development'
      const error = new Error('test error')

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        START_TAG,
        'Error in testMethod:',
        error,
        END_TAG,
      )
    })

    it('logs error when CYPRESS_INTERNAL_E2E_TESTING_SELF is set', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
      const error = new Error('test error')

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        START_TAG,
        'Error in testMethod:',
        error,
        END_TAG,
      )
    })

    it('does not report error when CYPRESS_CRASH_REPORTS is 0', () => {
      process.env.CYPRESS_CRASH_REPORTS = '0'
      const error = new Error('test error')

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      expect(cloudRequestStub).not.toHaveBeenCalled()
    })

    it('does not report error when CYPRESS_DISABLE_GUEST_TELEMETRY is set', () => {
      process.env.CYPRESS_DISABLE_GUEST_TELEMETRY = '1'
      const error = new Error('test error')

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      expect(cloudRequestStub).not.toHaveBeenCalled()
    })

    it('converts non-Error objects to Error', () => {
      const error = 'string error'

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      expect(cloudRequestStub).toHaveBeenCalledWith(
        'http://localhost:1234/studio/errors',
        expect.objectContaining({
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [expect.objectContaining({
            name: 'Error',
            message: 'string error',
            stack: expect.stringContaining('<stripped-path>report_studio_error.spec.ts'),
            code: undefined,
            errno: undefined,
            studioMethod: 'testMethod',
            studioMethodArgs: undefined,
          })],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          }),
        }),
      )
    })

    it('converts non-Error objects to Error instances', () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Something went wrong',
        code: 'TELEMETRY_ERROR',
      }

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error: objectError,
        studioMethod: 'telemetryService',
      })

      expect(cloudRequestStub).toHaveBeenCalledWith(
        'http://localhost:1234/studio/errors',
        expect.objectContaining({
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [expect.objectContaining({
            name: 'Error',
            message: expect.any(String),
            stack: expect.stringContaining('<stripped-path>report_studio_error.spec.ts'),
            code: undefined,
            errno: undefined,
            studioMethod: 'telemetryService',
            studioMethodArgs: undefined,
          })],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          }),
        }),
      )
    })

    it('handles Error objects correctly', () => {
      const error = new Error('test error')

      ;(error as any).code = 'test code'

      ;(error as any).errno = 123
      error.stack = 'test stack'

      ;(error as any).code = 'test code'

      ;(error as any).errno = 123

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      expect(cloudRequestStub).toHaveBeenCalledWith(
        'http://localhost:1234/studio/errors',
        expect.objectContaining({
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [expect.objectContaining({
            name: 'Error',
            message: 'test error',
            stack: 'test stack',
            code: 'test code',
            errno: 123,
            studioMethod: 'testMethod',
            studioMethodArgs: undefined,
          })],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          }),
        }),
      )
    })

    it('includes studioMethodArgs when provided', () => {
      const error = new Error('test error')
      const args = ['arg1', { key: '/path/to/file.js' }]

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
        studioMethodArgs: args,
      })

      expect(cloudRequestStub).toHaveBeenCalledWith(
        'http://localhost:1234/studio/errors',
        expect.objectContaining({
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [expect.objectContaining({
            name: 'Error',
            message: 'test error',
            stack: expect.stringContaining('<stripped-path>report_studio_error.spec.ts'),
            code: undefined,
            errno: undefined,
            studioMethod: 'testMethod',
            studioMethodArgs: JSON.stringify({ args: ['arg1', { key: '<stripped-path>file.js' }] }),
          })],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          }),
        }),
      )
    })

    it('handles errors in JSON.stringify for studioMethodArgs', () => {
      const error = new Error('test error')
      const circularObj: any = {}

      circularObj.self = circularObj

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
        studioMethodArgs: [circularObj],
      })

      expect(cloudRequestStub).toHaveBeenCalledWith(
        'http://localhost:1234/studio/errors',
        expect.objectContaining({
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [expect.objectContaining({
            name: 'Error',
            message: 'test error',
            stack: expect.stringContaining('<stripped-path>report_studio_error.spec.ts'),
            code: undefined,
            errno: undefined,
            studioMethod: 'testMethod',
            studioMethodArgs: expect.stringMatching(/Unknown args/),
          })],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          }),
        }),
      )
    })

    it('handles errors in CloudRequest.post', () => {
      const error = new Error('test error')
      const postError = new Error('post error')

      cloudRequestStub.mockRejectedValue(postError)

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      // Just verify the post was called, don't check debug output
      expect(cloudRequestStub).toHaveBeenCalled()
    })

    it('handles errors in payload construction', () => {
      const error = new Error('test error')

      vi.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new Error('JSON error')
      })

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      // Just verify the post was called, don't check debug output
      expect(cloudRequestStub).toHaveBeenCalled()
    })

    it('folds the underlying cause into the reported stack', () => {
      const cause = Object.assign(new Error('EPERM: operation not permitted, rename'), {
        code: 'EPERM',
        errno: -4048,
        syscall: 'rename',
        path: '/staging/server/index.js',
        dest: '/cache/final/server/index.js',
        stack: 'Error: EPERM: operation not permitted, rename\n    at Object.rename',
      })
      const error = Object.assign(new Error('Failed to publish studio bundle'), { cause })

      error.stack = 'BundleError: Failed to publish studio bundle\n    at ensureSignedBundle'

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      const payload = cloudRequestStub.mock.calls[0][1]
      const { stack } = payload.errors[0]

      expect(stack).toContain('Caused by:')
      expect(stack).toContain('Object.rename')
      expect(stack).toContain('code=EPERM')
      expect(stack).toContain('errno=-4048')
      expect(stack).toContain('syscall=rename')
    })

    it('extracts last error from AggregateError', () => {
      const aggregateError = new AggregateError(
        [new Error('First error'), new Error('Second error')],
        'Multiple errors',
      )

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error: aggregateError,
        studioMethod: 'testMethod',
      })

      expect(cloudRequestStub).toHaveBeenCalledWith(
        'http://localhost:1234/studio/errors',
        expect.objectContaining({
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [expect.objectContaining({
            name: 'Error',
            message: 'Second error',
            stack: expect.stringContaining('<stripped-path>report_studio_error.spec.ts'),
            code: undefined,
            errno: undefined,
            studioMethod: 'testMethod',
            studioMethodArgs: undefined,
          })],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          }),
        }),
      )
    })
  })
})
