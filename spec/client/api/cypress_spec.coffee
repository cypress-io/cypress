getNames = (queue) ->
  _(queue).pluck("name")

describe "Cypress API", ->
  before ->
    Cypress.start()

  beforeEach ->
    Cypress.set(@currentTest)

    loadFixture("html/dom").done (iframe) =>
      Cypress.setup(runner, $(iframe), {}, ->)

  afterEach ->
    Cypress.abort()

  after ->
    Cypress.stop()

  context "invoke", ->
    it "waits for isReady before invoking command", (done) ->
      ## when we are isReady false that means we should
      ## never begin invoking our commands
      cy.isReady(false)
      cy.noop()
      cy.on "invoke:start", -> done("should not trigger this")
      cy.on "set", ->
        ## we wait until we hear set because that means
        ## we've begun running our promise
        Cypress.abort().then -> done()

  #   it "returns a promise", ->
  #     cy.type("foo")

  context "#isReady", ->
    it "creates a deferred when not ready", ->
      cy.isReady(false)
      keys = _.keys cy.prop("ready")
      expect(keys).to.include("promise", "resolve", "reject")

    it "resolves the deferred when ready", (done) ->
      cy.isReady(false)
      cy.isReady(true)
      cy.on "ready", (bool) ->
        expect(cy.prop("ready").promise.isResolved()).to.be.true
        done()

  context "cancelling promises", ->
    it "cancels via a delay", (done) ->
      pending = Promise.pending()

      promise = Promise.delay(0).cancellable().then ->
        done("not cancelled")
      .caught Promise.CancellationError, (err) ->
        done()

      promise.cancel()

    ## this is currently failing: https://github.com/petkaantonov/bluebird/issues/393
    # it "cancels via a delay", (done) ->
    #   promise = Promise.resolve(undefined).cancellable()

    #   promise.then ->
    #     done("not cancelled")
    #   .caught Promise.CancellationError, (err) ->
    #     done()

    #   promise.cancel()

    # it "cancels the correct promise", (done) ->
    #   pending = Promise.pending()

    #   promise = Promise.resolve(pending.promise).cancellable()

    #   promise.then ->
    #     done("not cancelled")
    #   .caught Promise.CancellationError, (err) ->
    #     done()

    #   promise.cancel()
    #   pending.resolve()

  context ".abort", ->
    it "fires cancel event when theres an outstanding command", (done) ->
      cy.pause(1000)
      cy.on "cancel", -> done()
      cy.on "set", ->
        Cypress.abort()

    it "doesnt fire cancel event when no commands left", (done) ->
      cy.noop()
      cy.on "cancel", -> done("should not cancel")
      cy.on "end", ->
        Cypress.abort().then -> done()

    it "aborts running commands in the middle of running", (done) ->
      cy.on "cancel", (obj) ->
        expect(obj.name).to.eq "then"
        done()

      cy.noop().pause(10).then ->
        ## simulate the abort action happening
        ## during this .then command
        Cypress.abort()

        ## imagine we are returning another promise
        ## in our then command
        Promise.delay(10).then ->
          done("should not reach here")

  context "promises", ->
    it "doesnt invoke .then on the cypress instance", (done) ->
      _then = @sandbox.spy cy, "then"
      cy.pause(1000)

      cy.on "set", ->
        Cypress.abort().then ->
          expect(_then).not.to.be.called
          done()

  context "command error bubbling", ->
    beforeEach ->
      @uncaught = @sandbox.stub(cy.runner, "uncaught")

    it "does not emit command:end when a command fails", (done) ->
      trigger = @sandbox.spy cy, "trigger"

      cy
        .then ->
          _.defer ->
            expect(trigger).not.to.be.calledWith("command:end")
            done()
          throw new Error("err")

    it "emits fail and passes up err", (done) ->
      err = null
      cy.then ->
        err = new Error("err")
        throw err

      cy.on "fail", (e) ->
        expect(e).to.eq err
        done()

    it "passes the full stack trace to mocha", (done) ->
      err = null
      cy.then ->
        err = new Error("err")
        throw err

      cy.on "fail", (e) =>
        expect(@uncaught).to.be.calledWith(err)
        done()

  context ".restore", ->
    it "removes bound events", ->
      cy.on "foo", ->
      cy.on "bar", ->
      Cypress.restore()
      expect(cy._events).to.be.undefined

  context "saved subjects", ->
    it "will resolve deferred arguments", ->
      df = $.Deferred()

      _.delay ->
        df.resolve("iphone")
      , 100

      cy.find("input").type(df).then ($input) ->
        expect($input).to.have.value("iphone")

    it "handles saving subjects", ->
      cy.noop({foo: "foo"}).save("foo").noop(cy.get("foo")).then (subject) ->
        expect(subject).to.deep.eq {foo: "foo"}

    it "resolves falsy arguments", ->
      cy.noop(0).save("zero").then ->
        expect(cy.get("zero")).to.eq 0

    it "returns a function when no alias was found", ->
      cy.noop().then ->
        expect(cy.get("something")).to.be.a("function")

  context "property registry", ->
    beforeEach ->
      Cypress.restore()

    it "is initially empty", ->
      expect(cy.props).to.deep.eq {}

    it "inserts into the props registry", ->
      cy.prop("foo", "bar")
      expect(cy.props).to.deep.eq {foo: "bar"}

    it "calls unregister during restory", ->
      unregister = @sandbox.spy(cy, "unregister")
      Cypress.restore()
      expect(unregister).to.have.been.called

    it "acts as a getter when no value is given", ->
      cy.prop("foo", "bar")
      expect(cy.prop("foo")).to.eq "bar"

    describe "falsy setter values", ->
      before ->
        @set = (key, val) ->
          cy.prop(key, val)
          expect(cy.prop(key)).to.eq val

      it "sets zero", ->
        @set "zero", 0

      it "sets null", ->
        @set "null", null

      it "sets empty string", ->
        @set "string", ""

    describe "sets each prop in the registry to null", ->
      beforeEach ->
        cy.prop("foo", "bar")
        cy.prop("baz", "quux")
        cy.unregister()

        ## need to return null here else mocha would insert a .then
        ## into the cypress instance
        return null

      it "resets the registry", ->
        expect(cy.props).to.deep.eq {}

      it "deletes registered properies", ->

        expect([cy.prop("foo"), cy.prop("baz")]).to.deep.eq [undefined, undefined]

  context "#_timeout", ->
    it "setter", ->
      cy._timeout(500)
      expect(@test.timeout()).to.eq 500

    it "setter returns cy instance", ->
      ret = cy._timeout(500)
      expect(ret).to.eq cy

    it "setter can increase by delta", ->
      currentTimeout = @test.timeout()
      cy._timeout(500, true)
      expect(@test.timeout()).to.eq 500 + currentTimeout

    it "getter returns integer", ->
      timeout = @test.timeout()
      expect(cy._timeout()).to.eq timeout

    it "throws error when no runnable", ->
      Cypress.restore()
      fn = ->
        cy._timeout(500)

      expect(fn).to.throw(Error)

  context "#wait", ->
    describe "number argument", ->
      it "passes delay onto Promise", ->
        delay = @sandbox.spy Promise, "delay"
        cy.wait(100)
        cy.on "invoke:end", ->
          expect(delay).to.be.calledWith 100

      it "does not change the subject", ->
        cy
          .find("input")
          .then ($input) ->
            @$input = $input
          .wait(10)

        cy.on "invoke:end", (obj) =>
          if obj.name is "wait"
            expect(cy.prop("subject")).to.eq @$input

      it "does not time out the runnable", ->
        timer = @sandbox.useFakeTimers("setTimeout")
        trigger = @sandbox.spy(cy, "trigger")
        cy._timeout(100)
        cy.wait()
        timer.tick()
        timer.tick(5000)
        expect(trigger).not.to.be.calledWith "invoke:end"

      describe "function argument", ->
        it "resolves when truthy", ->
          cy.wait ->
            "foo" is "foo"

        it "retries when false", ->
          i = 0
          fn = ->
            i += 1
          fn = @sandbox.spy fn
          cy.then(fn).wait (i) ->
            console.log "retrying", i
            i is 3
          cy.on "end", ->
            expect(fn.callCount).to.eq 3

        it "retries when null", ->
          i = 0
          fn = ->
            i += 1
          fn = @sandbox.spy fn
          cy.then(fn).wait (i) ->
            if i isnt 2 then null else true
          cy.on "end", ->
            expect(fn.callCount).to.eq 2

        it "retries when undefined", ->
          i = 0
          fn = ->
            i += 1
          fn = @sandbox.spy fn
          cy.then(fn).wait (i) ->
            if i isnt 2 then undefined else true
          cy.on "end", ->
            expect(fn.callCount).to.eq 2

        it "resolves with existing subject", ->
          cy
            .find("input").then ($input) ->
              @$input = $input
            .wait(-> true)

          cy.on "invoke:end", (obj) =>
            if obj.name is "wait"
              expect(cy.prop("subject")).to.eq @$input

      describe "errors thrown", ->
        beforeEach ->
          @uncaught = @sandbox.stub(cy.runner, "uncaught")

        it "times out eventually", (done) ->
          ## forcibly reduce the timeout to 500 ms
          ## so we dont have to wait so long
          cy
            .noop()
            .wait (-> false), timeout: 500

          cy.on "fail", (err) ->
            expect(err.message).to.include "Timed out retrying."
            done()

        it "appends to the err message", (done) ->
          cy
            .noop()
            .wait (-> expect(true).to.be.false), timeout: 500

          cy.on "fail", (err) ->
            expect(err.message).to.include "Timed out retrying."
            done()

  context "#retry", ->
    it "returns a nested cancellable promise", (done) ->
      i = 0
      fn = ->
        i += 1
        console.log "iteration #", i

      fn = @sandbox.spy fn

      cy.then(fn).wait -> i is 3

      cy.on "retry", ->
        ## abort after the 1st retry
        ## which is the 2nd invocation of i
        ## which should prevent the 3rd invocation
        Cypress.abort() if i is 2

      cy.on "cancel", ->
        ## once from .then and once from .wait
        expect(fn.callCount).to.eq 2
        done()

  context "nested commands", ->
    beforeEach ->
      @setup = (fn = ->) =>
        Cypress.add "nested", ->
          cy.url()

        cy
          .inspect()
          .nested()
          .noop()
          .then -> fn()

    it "queues in the correct order", ->
      @setup ->
        expect(getNames(cy.queue)).to.deep.eq ["inspect", "nested", "url", "noop", "then", "then"]

    it "nested command should reference url as next property", ->
      @setup ->
        nested = _(cy.queue).find (obj) -> obj.name is "nested"
        expect(nested.next.name).to.eq "url"

    it "null outs nestedIndex prior to restoring", (done) ->
      @setup()
      cy.on "end", ->
        expect(cy.prop("nestedIndex")).to.be.null
        done()

    it "can recursively nest", ->
      Cypress.add "nest1", ->
        cy.nest2()

      Cypress.add "nest2", ->
        cy.noop()

      cy
        .inspect()
        .nest1()
        .then ->
          expect(getNames(cy.queue)).to.deep.eq ["inspect", "nest1", "nest2", "noop", "then", "then"]

    it "works with multiple nested commands", ->
      Cypress.add "multiple", ->
        cy
          .url()
          .location()
          .noop()

      cy
        .inspect()
        .multiple()
        .then ->
          expect(getNames(cy.queue)).to.deep.eq ["inspect", "multiple", "url", "location", "noop", "then", "then"]