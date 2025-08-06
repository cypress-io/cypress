import { expect } from 'chai'
import { sinon } from '../../../../spec_helper'
import { reportStudioError } from '@packages/server/lib/cloud/api/studio/report_studio_error'

describe('lib/cloud/api/studio/report_studio_error', () => {
  let cloudRequestStub: sinon.SinonStub
  let cloudApi: any

  beforeEach(() => {
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
        'Error in testMethod:',
        error,
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
        'Error in testMethod:',
        error,
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
        'Error in testMethod:',
        error,
      )
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

    it('handles Error objects correctly', () => {
      const error = new Error('test error')

      error.stack = 'test stack'

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
      const args = ['arg1', { key: 'value' }]

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
            studioMethod: 'testMethod',
            studioMethodArgs: JSON.stringify({ args }),
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
  })
})
