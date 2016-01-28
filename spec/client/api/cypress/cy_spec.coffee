describe "$Cypress.Cy API", ->
  context "unit", ->
    before ->
      @specIframe   = $("<iframe />").appendTo $("body")
      @remoteIframe = $("<iframe />").appendTo $("body")
      @specWindow   = @specIframe.prop("contentWindow")

    after ->
      @specIframe.remove()
      @remoteIframe.remove()

    beforeEach ->
      @Cypress = $Cypress.create()

    afterEach ->
      if cy = @Cypress.cy
        cy.stop()

    describe ".create", ->
      it "sets Cypress.cy", ->
        expect(@Cypress.cy).to.be.null
        cy = $Cypress.Cy.create(@Cypress, @specWindow)
        expect(@Cypress.cy).to.eq(cy)
        expect(@Cypress.cy).to.be.instanceof $Cypress.Cy

      it "sets cy on window", ->
        expect(window.cy).to.be.undefined
        cy = $Cypress.Cy.create(@Cypress, @specWindow)
        expect(window.cy).to.eq cy

      it "calls defaults", ->
        defaults = @sandbox.spy $Cypress.Cy.prototype, "defaults"
        $Cypress.Cy.create(@Cypress, @specWindow)
        expect(defaults).to.be.calledOnce

      it "sets cy globally on specWindow", ->
        delete @specWindow.cy
        cy = $Cypress.Cy.create(@Cypress, @specWindow)
        expect(@specWindow.cy).to.eq cy

    describe "#initialize", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "sets $remoteIframe", ->
        @Cypress.trigger "initialize", {$remoteIframe: @remoteIframe}
        expect(@cy.private("$remoteIframe")).to.eq @remoteIframe

    describe "#defaults", ->
      it "sets props to {}", ->
        cy = $Cypress.Cy.create(@Cypress, @specWindow)
        expect(cy.props).to.deep.eq {}
        cy.props.foo = "bar"
        cy.defaults()
        expect(cy.props).to.deep.eq {}

    describe "#listeners", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow, {})
        null

      it "stop", ->
        stop = @sandbox.stub @cy, "stop"
        @Cypress.trigger "stop"
        expect(stop).to.be.calledOnce

      it "restore", ->
        restore = @sandbox.stub @cy, "restore"
        @Cypress.trigger "restore"
        expect(restore).to.be.calledOnce

      it "abort", ->
        abort = @sandbox.stub @cy, "abort"
        @Cypress.trigger "abort"
        expect(abort).to.be.calledOnce

      it "unbinds previous cy listeners on Cypress", ->
        totalEvents = =>
          _.reduce @Cypress._events, (memo, value, key) ->
            memo += value.length
          , 0

        count = totalEvents()

        ## after instantiating another cy
        $Cypress.Cy.create(@Cypress, @specWindow, {})

        ## we shouldn't have any additional events
        expect(totalEvents()).not.to.be.gt count

    describe "#stop", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow, {})
        null

      it "deletes cy from the window", ->
        expect(window.cy).to.be.ok
        @Cypress.trigger("stop")
        expect(window.cy).to.be.undefined

      it "nulls out Cypress.cy", ->
        expect(@Cypress.cy).to.be.ok
        @Cypress.trigger("stop")
        expect(@Cypress.cy).to.be.null

    describe "#restore", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow, {})
        null

      it "calls reset on commands", ->
        reset = @sandbox.spy @cy.commands, "reset"
        @Cypress.trigger("restore")
        expect(reset).to.be.calledOnce

      it "calls endedEarlyErr if index > 0 and < queue.length", ->
        endedEarlyErr = @sandbox.stub @cy, "endedEarlyErr"
        @cy.prop("index", 2)
        @cy.commands.splice(0, 1, {})
        @cy.commands.splice(1, 2, {})
        @cy.commands.splice(2, 3, {})
        @cy.restore()
        expect(endedEarlyErr).to.be.calledOnce

    describe "#abort", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "returns a promise", ->
        abort = @cy.abort()
        expect(abort).to.be.instanceof Promise

    describe "#_setRunnable", ->
      beforeEach ->
        @Cypress.setConfig({})
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "sets prop(hookName)", ->
        @cy._setRunnable({}, "foobar")
        expect(@cy.private("hookName")).to.eq "foobar"

      it "sets startedAt on the runnable", ->
        obj = {}
        @cy._setRunnable(obj, "test")
        expect(obj.startedAt).to.be.a("date")

      it "sets runnable timeout to config.commandTimeout", ->
        @test.enableTimeouts(false)
        t = @test
        timeout = @sandbox.spy t, "timeout"
        @Cypress.config("commandTimeout", 1000)
        @cy._setRunnable(t)
        expect(timeout).to.be.calledWith 1000
        expect(t._timeout).to.eq 1000

    describe "#Promise", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "is attached to cy", ->
        expect(@cy.Promise).to.eq(Promise)
        expect(@cy.Promise.resolve).to.be.a("function")
        expect(@cy.Promise.pending).to.eq(Promise.pending)

      it "logs a deprecation", ->
        warning = @sandbox.spy @Cypress.Utils, "warning"

        @cy.Promise.resolve()

        expect(warning).to.be.calledWithMatch("cy.Promise is now deprecated")

    describe "#_", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "is attached to cy", ->
        expect(@cy._).to.eq(_)
        expect(@cy._.each).to.be.a("function")
        expect(@cy._.findWhere).to.eq(_.findWhere)

      it "logs a deprecation", ->
        warning = @sandbox.spy @Cypress.Utils, "warning"

        @cy._.each([], ->)

        expect(warning).to.be.calledWithMatch("cy._ is now deprecated")

    describe "#moment", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "is attached to cy", ->
        @sandbox.useFakeTimers()
        expect(@cy.moment).to.eq(moment)
        expect(@cy.moment().toJSON()).to.eq(moment().toJSON())

      it "logs a deprecation", ->
        warning = @sandbox.spy @Cypress.Utils, "warning"

        @cy.moment().format("MMM DD, YYYY")

        expect(warning).to.be.calledWithMatch("cy.moment is now deprecated")

    describe "#Blob", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "attaches blob utils", ->
        expect(@cy).to.have.property("Blob")
        expect(@cy.Blob).to.have.property("dataURLToBlob")
        expect(@cy.Blob).to.have.property("base64StringToBlob")

      it "logs a deprecation", ->
        warning = @sandbox.spy @Cypress.Utils, "warning"

        @cy.Blob.createBlob(['hello world'])

        expect(warning).to.be.calledWithMatch("cy.Blob is now deprecated")

  context "integration", ->
    enterCommandTestingMode()

    describe "#prop", ->
      beforeEach ->
        @Cypress.restore()

      it "is initially empty", ->
        expect(@cy.props).to.deep.eq {}

      it "inserts into the props registry", ->
        @cy.prop("foo", "bar")
        expect(@cy.props).to.deep.eq {foo: "bar"}

      it "calls defaults during restore", ->
        defaults = @sandbox.spy(@cy, "defaults")
        @Cypress.restore()
        expect(defaults).to.have.been.called

      it "acts as a getter when no value is given", ->
        @cy.prop("foo", "bar")
        expect(@cy.prop("foo")).to.eq "bar"

      describe "falsy setter values", ->
        before ->
          @set = (key, val) ->
            @cy.prop(key, val)
            expect(@cy.prop(key)).to.eq val
            expect(_.keys(@cy.props)).to.have.length(1)

        it "sets zero", ->
          @set "zero", 0

        it "sets null", ->
          @set "null", null

        it "sets empty string", ->
          @set "string", ""

        it "sets undefined", ->
          @set "undefined", undefined

      describe "sets each prop in the registry to null", ->
        beforeEach ->
          @cy.prop("foo", "bar")
          @cy.prop("baz", "quux")
          @cy.defaults()

          ## need to return null here else mocha would insert a .then
          ## into the @cypress instance
          return null

        it "resets the registry", ->
          expect(@cy.props).to.deep.eq {}

        it "deletes registered properies", ->

          expect([@cy.prop("foo"), @cy.prop("baz")]).to.deep.eq [undefined, undefined]

    describe "#_timeout", ->
      it "setter", ->
        @cy._timeout(500)
        expect(@test.timeout()).to.eq 500

      it "setter returns @cy instance", ->
        ret = @cy._timeout(500)
        expect(ret).to.eq @cy

      it "setter can increase by delta", ->
        currentTimeout = @test.timeout()
        @cy._timeout(500, true)
        expect(@test.timeout()).to.eq 500 + currentTimeout

      it "getter returns integer", ->
        timeout = @test.timeout()
        expect(@cy._timeout()).to.eq timeout

      it "throws error when no runnable", ->
        @cy.private("runnable", null)

        fn = =>
          @cy._timeout(500)

        expect(fn).to.throw(Error)

    describe "#_contains", ->
      it "returns true if the document contains the element", ->
        btn = @cy.$("#button").get(0)

        expect(@cy._contains(btn)).to.be.true

      it "returns false if the document does not contain the element", ->
        btn = @cy.$("#button").remove().get(0)

        expect(@cy._contains(btn)).to.be.false

      it "returns true if all elements in the collection are in the document", ->
        inputs = @cy.$("input")

        expect(@cy._contains(inputs)).to.be.true

      it "returns false if any elemen isnt in the document", ->
        inputs = @cy.$("input")
        inputs.last().remove()

        expect(@cy._contains(inputs)).to.be.false

    describe "#$", ->
      it "queries the remote document", ->
        input = @cy.$("#by-name input:first")
        expect(input.length).to.eq 1
        expect(input.prop("tagName")).to.eq "INPUT"

      it "scopes the selector to context if provided", ->
        input = @cy.$("input:first", @cy.$("#by-name"))
        expect(input.length).to.eq 1
        expect(input.prop("tagName")).to.eq "INPUT"

      it "proxies Deferred", (done) ->
        expect(@cy.$.Deferred).to.be.a("function")

        df = @cy.$.Deferred()

        _.delay ->
          df.resolve()
        , 10

        df.done -> done()

      _.each "Event Deferred ajax get getJSON getScript post when".split(" "), (fn) =>
        it "proxies $.#{fn}", ->
          expect(@cy.$[fn]).to.be.a("function")

      it "logs a deprecation", ->
        warning = @sandbox.spy @Cypress.Utils, "warning"

        @cy.$("#by-name input:first")

        expect(warning).to.be.calledWithMatch("cy.$ is now deprecated")


    describe "#run", ->
      it "calls prop next() on end if exists", (done) ->
        fn = -> done()

        @cy.prop("next", fn)

        @cy.noop()

      it "removes prop next after calling", (done) ->
        fn = => _.defer =>
          expect(@cy.prop("next")).to.eq null
          done()

        @cy.prop("next", fn)

        @cy.noop()

      it "does not reset the timeout on completion when a runnable has a state already", (done) ->
        ## this happens when using a (done) callback
        ## and using cy commands at the same time!
        ## because mocha detects the test is async
        ## it doesnt add the final .then() command
        ## which means our test receives a state
        ## immediately when the done() is called
        @cy.on "command:start", =>
          @ct = @sandbox.spy @cy.private("runnable"), "clearTimeout"

        @cy.on "command:end", =>
          expect(@ct.callCount).to.eq 0

          ## clear the state again else the function done()
          ## inside of mocha (runnable.run) will return
          ## early and not self.clearTimeout()
          delete @cy.private("runnable").state
          done()

        @cy.then ->
          @cy.private("runnable").state = "passed"

    describe "promises", ->
      it "doesnt invoke .then on the cypress instance", (done) ->
        _then = @sandbox.spy @cy, "then"
        @cy.wait(1000)

        @cy.on "set", (cmd) ->
          if cmd.get("name") is "wait"
            @Cypress.abort().then ->
              expect(_then).not.to.be.called
              done()

    describe "#invoke2", ->
      it "waits for isReady before invoking command", (done) ->
        ## when we are isReady false that means we should
        ## never begin invoking our commands
        @cy.isReady(false)
        @cy.noop()
        @cy.on "invoke:start", -> done("should not trigger this")
        @cy.on "set", ->
          ## we wait until we hear set because that means
          ## we've begun running our promise
          @Cypress.abort().then -> done()

    describe "#isReady", ->
      it "creates a deferred when not ready", ->
        @cy.isReady(false)
        keys = _.keys @cy.prop("ready")
        expect(keys).to.include("promise", "resolve", "reject")

      it "resolves the deferred when ready", (done) ->
        @cy.isReady(false)
        @cy.isReady(true)
        @cy.once "ready", (bool) ->
          expect(@prop("ready").promise.isResolved()).to.be.true
          done()
        null

      it "prevents a bug creating an additional .then promise", (done) ->
        @cy.isReady(false)
        @cy.isReady(true)

        @cy.on "end", ->
          expect(@commands.length).to.eq(1)
          done()

        @cy.noop({})

    describe "nested commands", ->
      beforeEach ->
        @setup = (fn = ->) =>
          @Cypress.addParentCommand "nested", =>
            @cy.chain().url()

          @cy
            .nested()
            .noop()
            .then ->
              fn()

      it "works when custom command is first command", ->
        Cypress.addParentCommand "login", (email) =>
          @cy.get("input:first").type("foo")

        @cy.login().then ->
          expect(@cy.$("input:first")).to.have.value("foo")

      it "ensures to splice queue correctly on first custom command", ->
        Cypress.addParentCommand "login", (email) =>
          @cy.get("input:first").type("foo")

        @cy.login().noop().then ->
          expect(@cy.commands.names()).to.deep.eq ["login", "get", "type", "noop", "then", "then"]

      it "queues in the correct order", ->
        @setup =>
          expect(@cy.commands.names()).to.deep.eq ["nested", "url", "noop", "then", "then"]

      it "nested command should reference url as next property", ->
        @setup =>
          nested = @cy.commands.findWhere({name: "nested"})
          expect(nested.get("next").name).to.eq "url"

      it "null outs nestedIndex prior to restoring", (done) ->
        @setup()
        @cy.on "end", ->
          expect(@prop("nestedIndex")).to.be.null
          done()

      it "can recursively nest", ->
        @Cypress.addParentCommand "nest1", =>
          @cy.nest2()

        @Cypress.addParentCommand "nest2", =>
          @cy.noop()

        @cy
          .nest1()
          .then ->
            expect(@cy.commands.names()).to.deep.eq ["nest1", "nest2", "noop", "then", "then"]

      it "works with multiple nested commands", ->
        @Cypress.addParentCommand "multiple", =>
          @cy
            .url()
            .location()
            .noop()

        @cy
          .multiple()
          .then ->
            expect(@cy.commands.names()).to.deep.eq ["multiple", "url", "location", "noop", "then", "then"]

    describe "cancelling promises", ->
      it "cancels via a delay", (done) ->
        pending = Promise.pending()

        promise = Promise.delay(0).cancellable().then ->
          done("not cancelled")
        .caught Promise.CancellationError, (err) ->
          done()

        promise.cancel()
