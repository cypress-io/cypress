import { expect } from 'chai'
import { sinon } from '../../../../spec_helper'
import { reportCyPromptError } from '@packages/server/lib/cloud/api/cy-prompt/report_cy_prompt_error'

describe('lib/cloud/api/cy-prompt/report_cy_prompt_error', () => {
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
    delete process.env.CYPRESS_LOCAL_CY_PROMPT_PATH
    delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
    if (oldNodeEnv) {
      process.env.NODE_ENV = oldNodeEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  describe('reportCyPromptError', () => {
    it('logs error when CYPRESS_LOCAL_CY_PROMPT_PATH is set', () => {
      sinon.stub(console, 'error')
      process.env.CYPRESS_LOCAL_CY_PROMPT_PATH = '/path/to/cy-prompt'
      const error = new Error('test error')

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
      })

      // eslint-disable-next-line no-console
      expect(console.error).to.have.been.calledWith(
        'Error in testMethod:',
        error,
      )
    })

    it('logs error when NODE_ENV is development', () => {
      sinon.stub(console, 'error')
      process.env.NODE_ENV = 'development'
      const error = new Error('test error')

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
      })

      // eslint-disable-next-line no-console
      expect(console.error).to.have.been.calledWith(
        'Error in testMethod:',
        error,
      )
    })

    it('logs error when CYPRESS_INTERNAL_E2E_TESTING_SELF is set', () => {
      sinon.stub(console, 'error')
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
      const error = new Error('test error')

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
      })

      // eslint-disable-next-line no-console
      expect(console.error).to.have.been.calledWith(
        'Error in testMethod:',
        error,
      )
    })

    it('does not report error when CYPRESS_CRASH_REPORTS is 0', () => {
      process.env.CYPRESS_CRASH_REPORTS = '0'
      const error = new Error('test error')

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
      })

      expect(cloudRequestStub).to.not.have.been.called
    })

    it('converts non-Error objects to Error', () => {
      const error = 'string error'

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
      })

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/cy-prompt/errors',
        {
          cyPromptHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'string error',
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_cy_prompt_error_spec.ts')),
            code: undefined,
            errno: undefined,
            cyPromptMethod: 'testMethod',
            cyPromptMethodArgs: undefined,
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    })

    it('handles Error objects correctly', () => {
      const error = new Error('test error')

      ;(error as any).code = 'test code'

      ;(error as any).errno = 123
      error.stack = 'test stack'

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
      })

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/cy-prompt/errors',
        {
          cyPromptHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'test error',
            stack: 'test stack',
            code: 'test code',
            errno: 123,
            cyPromptMethod: 'testMethod',
            cyPromptMethodArgs: undefined,
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    })

    it('includes cyPromptMethodArgs when provided', () => {
      const error = new Error('test error')
      const args = ['arg1', { key: '/path/to/file.js' }]

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
        cyPromptMethodArgs: args,
      })

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/cy-prompt/errors',
        {
          cyPromptHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'test error',
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_cy_prompt_error_spec.ts')),
            code: undefined,
            errno: undefined,
            cyPromptMethod: 'testMethod',
            cyPromptMethodArgs: JSON.stringify({ args: ['arg1', { key: '<stripped-path>file.js' }] }),
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    })

    it('handles errors in JSON.stringify for cyPromptMethodArgs', () => {
      const error = new Error('test error')
      const circularObj: any = {}

      circularObj.self = circularObj

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
        cyPromptMethodArgs: [circularObj],
      })

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/cy-prompt/errors',
        {
          cyPromptHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'test error',
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_cy_prompt_error_spec.ts')),
            code: undefined,
            errno: undefined,
            cyPromptMethod: 'testMethod',
            cyPromptMethodArgs: sinon.match(/Unknown args/),
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    })

    it('handles errors in CloudRequest.post', () => {
      const error = new Error('test error')
      const postError = new Error('post error')

      cloudRequestStub.rejects(postError)

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
      })

      // Just verify the post was called, don't check debug output
      expect(cloudRequestStub).to.be.called
    })

    it('handles errors in payload construction', () => {
      const error = new Error('test error')

      sinon.stub(JSON, 'stringify').throws(new Error('JSON error'))

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error,
        cyPromptMethod: 'testMethod',
      })

      // Just verify the post was called, don't check debug output
      expect(cloudRequestStub).to.be.called
    })

    it('extracts last error from AggregateError', () => {
      const aggregateError = new AggregateError(
        [new Error('First error'), new Error('Second error')],
        'Multiple errors',
      )

      reportCyPromptError({
        cloudApi,
        cyPromptHash: 'abc123',
        projectSlug: 'test-project',
        error: aggregateError,
        cyPromptMethod: 'testMethod',
      })

      expect(cloudRequestStub).to.be.calledWithMatch(
        'http://localhost:1234/cy-prompt/errors',
        {
          cyPromptHash: 'abc123',
          projectSlug: 'test-project',
          errors: [{
            name: 'Error',
            message: 'Second error',
            stack: sinon.match((stack) => stack.includes('<stripped-path>report_cy_prompt_error_spec.ts')),
            code: undefined,
            errno: undefined,
            cyPromptMethod: 'testMethod',
            cyPromptMethodArgs: undefined,
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    })
  })
})
