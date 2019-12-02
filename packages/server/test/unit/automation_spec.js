require('../spec_helper')

const _ = require('lodash')
const Automation = require(`${root}lib/automation`)

describe('lib/automation', () => {
  beforeEach(function () {
    this.automation = Automation.create()
  })

  context('.reset', () => {
    it('resets middleware', function () {
      const m = this.automation.get()

      // all props are null by default
      expect(_.omitBy(m, _.isNull)).to.deep.eq({})

      const onRequest = function () {}
      const onPush = function () {}

      this.automation.use({ onRequest, onPush })

      expect(this.automation.get().onRequest).to.eq(onRequest)
      expect(this.automation.get().onPush).to.eq(onPush)

      this.automation.reset()

      expect(this.automation.get().onRequest).to.be.null

      // keep around onPush
      expect(this.automation.get().onPush).to.eq(onPush)
    })
  })
})
