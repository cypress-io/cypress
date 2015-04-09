describe "$Cypress.Cy Retry Extension", ->
  enterCommandTestingMode()

  context "#_retry", ->
    it "returns a nested cancellable promise", (done) ->
      i = 0
      fn = ->
        i += 1
        console.log "iteration #", i

      fn = @sandbox.spy fn

      @cy.noop({}).then(fn).until -> i is 3

      @cy.on "retry", ->
        ## abort after the 1st retry
        ## which is the 2nd invocation of i
        ## which should prevent the 3rd invocation
        @Cypress.abort() if i is 2

      @cy.on "cancel", ->
        ## once from .then and once from .until
        expect(fn.callCount).to.eq 2
        done()

    it "stores the runnables current timeout", ->
      prevTimeout = @test.timeout()
      options = {}
      fn = ->
      @cy._retry(fn, options)
      expect(options.runnableTimeout).to.eq prevTimeout

    it "increases the runnables timeout exponentially", ->
      prevTimeout = @test.timeout()
      timeout = @sandbox.spy @test, "timeout"
      fn = ->
      @cy._retry(fn, {})
      expect(timeout).to.be.calledWith 1e9

      expect(@test.timeout()).to.be.gt prevTimeout

