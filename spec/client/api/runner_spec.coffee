describe "Runner API", ->
  beforeEach ->
    Cypress.start()

  context "interface", ->
    it "returns runner instance", ->
      r = Cypress.Runner.create({})
      expect(r).to.be.instanceof Cypress.Runner

    it ".getRunner errors without a runner", ->
      expect(Cypress.getRunner).to.throw "Cypress._runner instance not found!"

    it ".getRunner returns runner instance", ->
      r = Cypress.Runner.create({})
      expect(Cypress.getRunner()).to.eq r

  context "Cypress events", ->
    beforeEach ->
      @runner = Cypress.Runner.create({})

    it "fail", ->
      fail = @sandbox.stub @runner, "fail"
      Cypress.trigger "fail"
      expect(fail).to.be.calledOnce

    it "abort", ->
      abort = @sandbox.stub @runner, "abort"
      Cypress.trigger "abort"
      expect(abort).to.be.calledOnce

    it "destroy", ->
      destroy = @sandbox.stub @runner, "destroy"
      Cypress.trigger "destroy"
      expect(destroy).to.be.calledOnce
      expect(Cypress.getRunner).to.throw

  context "#constructor", ->
    it "stores mocha runner instance", ->
      r = Cypress.Runner.create({})
      expect(r.runner).to.deep.eq({})

  context "#abort", ->
    beforeEach ->
      ## think about building this into a helper method which
      ## takes an object + array of object nested structure
      ## and automatically builds these tests for us
      # {
      #   tests: ["root test 1", "root test 2"]
      #   suites: {
      #     "suite 1": ["suite 1, test 1", "suite 1, test 2"]
      #     "suite 2": []
      #   }
      # }

      @mochaSuite = new Mocha.Suite('', new Mocha.Context)
      @mochaSuite.addTest new Mocha.Test "root test 1", ->
      @mochaSuite.addTest new Mocha.Test "root test 2", ->

      s1 = Mocha.Suite.create @mochaSuite, "first nested suite"
      s1.addTest new Mocha.Test "suite 1, test 1", ->
      s1.addTest new Mocha.Test "suite 1, test 2", ->

      s2 = Mocha.Suite.create @mochaSuite, "second nested suite"
      s2.addTest new Mocha.Test "suite 2, test1", ->

      @mochaRunner = new Mocha.Runner(@mochaSuite)

      @runner = Cypress.Runner.create(@mochaRunner)

    afterEach ->
      @runner.runner.removeAllListeners()

    it "aborts the mocha runner", ->
      abort = @sandbox.spy @mochaRunner, "abort"
      @runner.abort()
      expect(abort).to.be.calledOnce

    ## this is testing mocha functionality but
    ## we essentially need this for regression
    ## tests for mocha upgrades
    ## mocha has NO tests surrounding .abort()
    it "does not run additional tests", (done) ->
      ## we have 5 tests total
      tests = []

      @runner.runner.on "test", (test) =>
        tests.push(test)
        ## we abort after the 3rd test
        if test.title is "suite 1, test 1"
          @runner.abort()

      @runner.runner.run ->
        ## so we didnt run 2, and should only
        ## have run 3 tests!
        expect(tests).to.have.length(3)
        done()
