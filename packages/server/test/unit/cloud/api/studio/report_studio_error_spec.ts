import { expect } from 'chai'
import { sinon } from '../../../../spec_helper'
import { reportStudioError } from '@packages/server/lib/cloud/api/studio/report_studio_error'
import { START_TAG, END_TAG } from '@packages/stderr-filtering'

describe('lib/cloud/api/studio/report_studio_error', () => {
  let cloudRequestStub: sinon.SinonStub
  let cloudApi: any
  let oldNodeEnv: string | undefined

  beforeEach(() => {
    oldNodeEnv = process.env.NODE_ENV
    cloudRequestStub = sinon.stub()
    cloudApi = {
      cloudUrl: 'http://localhost:1234',
      cloudHeaders: { 'x-cypress-version': '1.2.3' },
      CloudRequest: {
        post: cloudRequestStub,
      },
    }
  })

  afterEach(() => {
    sinon.restore()
    delete process.env.CYPRESS_CRASH_REPORTS
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
      sinon.stub(console, 'error')
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
      expect(console.error).to.have.been.calledWith(
        START_TAG,
        'Error in testMethod:',
        error,
        END_TAG,
      )
    })

    it('logs error when NODE_ENV is development', () => {
      sinon.stub(console, 'error')
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
      expect(console.error).to.have.been.calledWith(
        START_TAG,
        'Error in testMethod:',
        error,
        END_TAG,
      )
    })

    it('logs error when CYPRESS_INTERNAL_E2E_TESTING_SELF is set', () => {
      sinon.stub(console, 'error')
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
      expect(console.error).to.have.been.calledWith(
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

      expect(cloudRequestStub).to.not.have.been.called
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

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/studio/errors',
        {
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'string error',
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_studio_error_spec.ts')),
            code: undefined,
            errno: undefined,
            studioMethod: 'testMethod',
            studioMethodArgs: undefined,
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          },
        },
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

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/studio/errors',
        {
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: sinon.match.string,
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_studio_error_spec.ts')),
            code: undefined,
            errno: undefined,
            studioMethod: 'telemetryService',
            studioMethodArgs: undefined,
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          },
        },
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

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/studio/errors',
        {
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'test error',
            stack: 'test stack',
            code: 'test code',
            errno: 123,
            studioMethod: 'testMethod',
            studioMethodArgs: undefined,
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          },
        },
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

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/studio/errors',
        {
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'test error',
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_studio_error_spec.ts')),
            code: undefined,
            errno: undefined,
            studioMethod: 'testMethod',
            studioMethodArgs: JSON.stringify({ args: ['arg1', { key: '<stripped-path>file.js' }] }),
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          },
        },
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

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/studio/errors',
        {
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'test error',
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_studio_error_spec.ts')),
            code: undefined,
            errno: undefined,
            studioMethod: 'testMethod',
            studioMethodArgs: sinon.match(/Unknown args/),
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          },
        },
      )
    })

    it('handles errors in CloudRequest.post', () => {
      const error = new Error('test error')
      const postError = new Error('post error')

      cloudRequestStub.rejects(postError)

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      // Just verify the post was called, don't check debug output
      expect(cloudRequestStub).to.be.called
    })

    it('handles errors in payload construction', () => {
      const error = new Error('test error')

      sinon.stub(JSON, 'stringify').throws(new Error('JSON error'))

      reportStudioError({
        cloudApi,
        studioHash: 'abc123',
        projectSlug: 'test-project',
        error,
        studioMethod: 'testMethod',
      })

      // Just verify the post was called, don't check debug output
      expect(cloudRequestStub).to.be.called
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

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/studio/errors',
        {
          studioHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'Second error',
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_studio_error_spec.ts')),
            code: undefined,
            errno: undefined,
            studioMethod: 'testMethod',
            studioMethodArgs: undefined,
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': '1.2.3',
          },
        },
      )
    })
  })
})
