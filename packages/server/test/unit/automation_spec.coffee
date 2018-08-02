require("../spec_helper")

_ = require("lodash")
Automation = require("#{root}lib/automation")

describe "lib/automation", ->
  beforeEach ->
    @automation = Automation.create()

  context ".reset", ->
    it "resets middleware", ->
      m = @automation.get()

      ## all props are null by default
      expect(_.omitBy(m, _.isNull)).to.deep.eq({})

      onRequest = ->
      onPush = ->
      @automation.use({ onRequest, onPush })

      expect(@automation.get().onRequest).to.eq(onRequest)
      expect(@automation.get().onPush).to.eq(onPush)

      @automation.reset()

      expect(@automation.get().onRequest).to.be.null

      ## keep around onPush
      expect(@automation.get().onPush).to.eq(onPush)
