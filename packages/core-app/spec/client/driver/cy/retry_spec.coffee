describe "$Cypress.Cy Retry Extension", ->
  enterCommandTestingMode()

  context "#_retry", ->
    # it "returns a nested cancellable promise", (done) ->
    #   i = 0
    #   fn = ->
    #     i += 1
    #     console.log "iteration #", i

    #   fn = @sandbox.spy fn

    #   @cy.noop({}).then(fn).until -> i is 3

    #   @cy.on "retry", ->
    #     ## abort after the 1st retry
    #     ## which is the 2nd invocation of i
    #     ## which should prevent the 3rd invocation
    #     @Cypress.abort() if i is 2

    #   @cy.on "cancel", ->
    #     ## once from .then and once from .until
    #     expect(fn.callCount).to.eq 2
    #     done()

    it "stores the runnables current timeout", ->
      prevTimeout = @test.timeout()
      options = {}
      fn = ->
      @cy._retry(fn, options)
      expect(options._runnableTimeout).to.eq prevTimeout

    it "removes the runnables timeout", ->
      prevTimeout = @test.timeout()
      clearTimeout = @sandbox.spy @test, "clearTimeout"
      fn = ->
      @cy._retry(fn, {})
      expect(clearTimeout).to.be.called