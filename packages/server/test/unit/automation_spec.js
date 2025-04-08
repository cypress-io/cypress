require('../spec_helper')

const _ = require('lodash')
const { Automation } = require(`../../lib/automation`)

describe('lib/automation', () => {
  beforeEach(function () {
    this.automation = new Automation({})
  })

  context('.reset', () => {
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
})
