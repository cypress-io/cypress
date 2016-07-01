describe "Uncaught Hook Integration Tests", ->
  enterIntegrationTestingMode("html/hook_uncaught", {silent: true})

  context "uncaught errors should trigger 'test:after:hooks' and 'test:after:run' events", ->
    beforeEach ->
      @Cypress.chai.restore()

    it "fires all the events", (done) ->
      fn = _.after 3, -> done()

      @Cypress.on "domain:set", (url, cb) ->
        cb("http://localhost:3500")

      @Cypress.on "test:after:hooks", (test) ->
        expect(test.title).to.eq("t1")
        fn()

      @Cypress.on "test:after:run", (test) ->
        expect(test.title).to.eq("t1")
        fn()

      @Cypress.on "run:end", ->
        fn()

      @Cypress.run =>
