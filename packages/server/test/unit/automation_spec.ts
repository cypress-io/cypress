import '../spec_helper'
import _ from 'lodash'
import { Automation } from '../../lib/automation'

describe('lib/automation', () => {
  beforeEach(function () {
    // @ts-expect-error
    this.automation = new Automation({})
  })

  describe('.reset', () => {
    it('resets middleware', function () {
      const m = this.automation.getMiddleware()

      // all props are null by default
      expect(_.omitBy(m, _.isNull)).to.deep.eq({})

      const onRequest = function () {}
      const onPush = function () {}

      this.automation.use({ onRequest, onPush })

      expect(this.automation.getMiddleware().onRequest).to.eq(onRequest)
      expect(this.automation.getMiddleware().onPush).to.eq(onPush)

      this.automation.reset()

      expect(this.automation.getMiddleware().onRequest).to.be.null

      // keep around onPush
      expect(this.automation.getMiddleware().onPush).to.eq(onPush)
    })
  })

  describe('.response', () => {
    it('deletes the pending request from the requests map after responding', function () {
      let capturedId

      const fn = (_message, _data, id) => {
        capturedId = id
      }

      const promise = this.automation.requestAutomationResponse('take:screenshot', {}, fn)

      // the pending request is tracked while awaiting the browser's response
      expect(this.automation.getRequests()).to.have.property(capturedId)

      this.automation.response(capturedId, { response: 'foo' })

      // once responded to, the request (and anything it retains, e.g. a large
      // screenshot data URL) must be released to avoid a memory leak
      expect(this.automation.getRequests()).to.not.have.property(capturedId)

      return promise.then((resp) => {
        expect(resp).to.eq('foo')
      })
    })
  })
})
