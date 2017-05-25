{ $, _, Promise, moment } = window.testUtils

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
      @logWarning = @sandbox.stub(@Cypress.utils, "warning")

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

      it "throws on accessing props", ->
        fn = =>
          cy = $Cypress.Cy.create(@Cypress, @specWindow)
          cy.props.foo

        expect(fn).to.throw(/You are accessing a private property/)
        expect(fn).to.throw(/getter function: cy.state\(\.\.\.\)/)
        expect(fn).to.throw(/api\/state/)

      it "throws on accessing privates", ->
        fn = =>
          cy = $Cypress.Cy.create(@Cypress, @specWindow)
          cy.privates.foo

        expect(fn).to.throw(/You are accessing a private property/)
        expect(fn).to.throw(/getter function: cy.privateState\(\.\.\.\)/)
        expect(fn).not.to.throw(/api/)

    describe "#initialize", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "sets $remoteIframe", ->
        @Cypress.trigger "initialize", {$remoteIframe: @remoteIframe}
        expect(@cy.privateState("$remoteIframe")).to.eq @remoteIframe

    describe "#defaults", ->
      it "sets state to {}", ->
        cy = $Cypress.Cy.create(@Cypress, @specWindow)
        expect(cy._state).to.deep.eq {}
        cy.state("foo", "bar")
        cy.defaults()
        expect(cy._state).to.deep.eq {}

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
        @Cypress.trigger("restore")
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
        reset = @sandbox.spy @cy.queue, "reset"
        @Cypress.trigger("restore")
        expect(reset).to.be.calledOnce

    describe "#abort", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "returns a promise", ->
        abort = @cy.abort()
        expect(abort).to.be.instanceof Promise

    describe "#checkForEndedEarly", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "calls endedEarlyErr if index > 0 and < queue.length", ->
        endedEarlyErr = @sandbox.stub @cy, "endedEarlyErr"
        @cy.state("index", 2)
        @cy.queue.splice(0, 1, {})
        @cy.queue.splice(1, 2, {})
        @cy.queue.splice(2, 3, {})
        @cy.checkForEndedEarly()
        expect(endedEarlyErr).to.be.calledOnce

    describe "#_setRunnable", ->
      beforeEach ->
        @Cypress.setConfig({})
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "sets prop(hookName)", ->
        @cy._setRunnable({}, "foobar")
        expect(@cy.privateState("hookName")).to.eq "foobar"

      it "sets startedAt on the runnable", ->
        obj = {}
        @cy._setRunnable(obj, "test")
        expect(obj.startedAt).to.be.a("date")

      it "sets runnable timeout to config.defaultCommandTimeout", ->
        @test.enableTimeouts(false)
        t = @test
        timeout = @sandbox.spy t, "timeout"
        @Cypress.config("defaultCommandTimeout", 1000)
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
        @cy.Promise.resolve()

        expect(@logWarning).to.be.calledWithMatch("cy.Promise is now deprecated")

    describe "#_", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "is attached to cy", ->
        expect(@cy._).to.eq(_)
        expect(@cy._.each).to.be.a("function")
        expect(@cy._.find).to.eq(_.find)

      it "logs a deprecation", ->
        @cy._.each([], ->)

        expect(@logWarning).to.be.calledWithMatch("cy._ is now deprecated")

    describe "#moment", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "is attached to cy", ->
        expect(@cy.moment).to.eq(moment)

      it "logs a deprecation", ->
        @cy.moment().format("MMM DD, YYYY")

        expect(@logWarning).to.be.calledWithMatch("cy.moment is now deprecated")

    describe "#Blob", ->
      beforeEach ->
        @cy = $Cypress.Cy.create(@Cypress, @specWindow)
        null

      it "attaches blob utils", ->
        expect(@cy).to.have.property("Blob")
        expect(@cy.Blob).to.have.property("dataURLToBlob")
        expect(@cy.Blob).to.have.property("base64StringToBlob")

      it "logs a deprecation", ->
        @cy.Blob.createBlob(['hello world'])

        expect(@logWarning).to.be.calledWithMatch("cy.Blob is now deprecated")

  context "integration", ->
    enterCommandTestingMode()

    beforeEach ->
      @logWarning = @sandbox.stub(@Cypress.utils, "warning")

    describe "#state", ->
      beforeEach ->
        @Cypress.restore()

      it "is initially empty", ->
        expect(@cy._state).to.deep.eq {}

      it "inserts into the state registry", ->
        @cy.state("foo", "bar")
        expect(@cy._state).to.deep.eq {foo: "bar"}

      it "calls defaults during restore", ->
        defaults = @sandbox.spy(@cy, "defaults")
        @Cypress.restore()
        expect(defaults).to.have.been.called

      it "acts as a getter when no value is given", ->
        @cy.state("foo", "bar")
        expect(@cy.state("foo")).to.eq "bar"

      describe "falsy setter values", ->
        before ->
          @set = (key, val) ->
            @cy.state(key, val)
            expect(@cy.state(key)).to.eq val
            expect(_.keys(@cy._state)).to.have.length(1)

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
          @cy.state("foo", "bar")
          @cy.state("baz", "quux")
          @cy.defaults()

          ## need to return null here else mocha would insert a .then
          ## into the @cypress instance
          return null

        it "resets the registry", ->
          expect(@cy._state).to.deep.eq {}

        it "deletes registered properies", ->

          expect([@cy.state("foo"), @cy.state("baz")]).to.deep.eq [undefined, undefined]

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
        @cy.privateState("runnable", null)

        fn = =>
          @cy._timeout(500)

        expect(fn).to.throw(Error)

    describe "#_contains", ->
      it "returns true if the document contains the element", ->
        btn = @cy.$$("#button").get(0)

        expect(@cy._contains(btn)).to.be.true

      it "returns false if the document does not contain the element", ->
        btn = @cy.$$("#button").remove().get(0)

        expect(@cy._contains(btn)).to.be.false

      it "returns true if all elements in the collection are in the document", ->
        inputs = @cy.$$("input")

        expect(@cy._contains(inputs)).to.be.true

      it "returns false if any elemen isnt in the document", ->
        inputs = @cy.$$("input")
        inputs.last().remove()

        expect(@cy._contains(inputs)).to.be.false

    describe "#$$", ->
      it "queries the remote document", ->
        input = @cy.$$("#by-name input:first")
        expect(input.length).to.eq 1
        expect(input.prop("tagName")).to.eq "INPUT"

      it "scopes the selector to context if provided", ->
        input = @cy.$$("input:first", @cy.$$("#by-name"))
        expect(input.length).to.eq 1
        expect(input.prop("tagName")).to.eq "INPUT"

    describe "#$", ->
      it "logs a deprecation", ->
        @cy.$("#by-name input:first")

        expect(@logWarning).to.be.calledWithMatch("cy.$ is now deprecated")

    describe "#run", ->
      it "calls prop next() on end if exists", (done) ->
        fn = -> done()

        @cy.state("next", fn)

        @cy.noop()

      it "removes prop next after calling", (done) ->
        fn = => _.defer =>
          expect(@cy.state("next")).to.eq null
          done()

        @cy.state("next", fn)

        @cy.noop()

      it "does not reset the timeout on completion when a runnable has a state already", (done) ->
        ## this happens when using a (done) callback
        ## and using cy commands at the same time!
        ## because mocha detects the test is async
        ## it doesnt add the final .then() command
        ## which means our test receives a state
        ## immediately when the done() is called
        @cy.on "command:start", =>
          @_t = @sandbox.spy @cy, "_timeout"
          @ct = @sandbox.spy @cy.privateState("runnable"), "clearTimeout"

        @cy.on "command:end", =>
          ## we changed cy.then to do a clearTimeout
          ## so we expect that to be 1, but not 2
          ## and we expect @_timeout() to be called once
          ## but with zero arguments
          expect(@_t.args[0].length).eq 0
          expect(@_t.callCount).to.eq 1
          expect(@ct.callCount).to.eq 1

          ## clear the state again else the function done()
          ## inside of mocha (runnable.run) will return
          ## early and not self.clearTimeout()
          delete @cy.privateState("runnable").state
          done()

        @cy.then ->
          @cy.privateState("runnable").state = "passed"

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
        keys = _.keys @cy.state("ready")
        expect(keys).to.include("promise", "resolve", "reject")

      it "resolves the deferred when ready", (done) ->
        @cy.isReady(false)
        @cy.isReady(true)
        @cy.once "ready", (bool) ->
          expect(@state("ready").promise.isResolved()).to.be.true
          done()
        null

      it "prevents a bug creating an additional .then promise", (done) ->
        @cy.isReady(false)
        @cy.isReady(true)

        @cy.on "end", ->
          expect(@queue.length).to.eq(1)
          done()

        @cy.noop({})

    describe "#endedEarlyErr", ->
      beforeEach ->
        @allowErrors()

      it "displays error with commands listed", (done) ->
        @cy.endedEarlyErr.restore()

        @cy.on "fail", (err) ->
          expect(err.message).to.include("The 6 queued commands that have not yet run are:")
          expect(err.message).to.include("- cy.find('input')")
          expect(err.message).to.include("- cy.click('...')")
          expect(err.message).to.include("- cy.then('...')")
          expect(err.message).to.include("- cy.get('.badge, ...')")
          expect(err.message).to.include("- cy.should('have.prop, class, badge')")
          expect(err.message).to.include("- cy.then('...')")
          done()

        @cy
          .get("form:first").find('input').click({multiple: true})
          .then -> "foo"
          .get(".badge", {timeout: 1000}).should("have.prop", "class", "badge")
          .then ->
            @cy.endedEarlyErr(1)

    describe "internals of custom commands", ->
      beforeEach ->
          @setup = (fn = ->) =>
            @Cypress.Commands.add "nested", =>
              @cy.url()

            @cy
              .nested()
              .noop()
              .then ->
                fn()

      it "ensures to splice queue correctly on first custom command", ->
        @Cypress.Commands.add  "login", (email) =>
          @cy.get("input:first").type("foo")

        @cy.login().noop().then ->
          expect(@cy.queue.names()).to.deep.eq ["login", "get", "type", "noop", "then", "then"]

      it "queues in the correct order", ->
        @setup =>
          expect(@cy.queue.names()).to.deep.eq ["nested", "url", "noop", "then", "then"]

      it "nested command should reference url as next property", ->
        @setup =>
          nested = @cy.queue.find({name: "nested"})
          expect(nested.get("next").get("name")).to.eq "url"

      it "null outs nestedIndex prior to restoring", (done) ->
        @setup()
        @cy.on "end", ->
          expect(@state("nestedIndex")).to.be.null
          done()

      it "can recursively nest", ->
        @Cypress.Commands.add "nest1", =>
          @cy.nest2()

        @Cypress.Commands.add "nest2", =>
          @cy.noop()

        @cy
          .nest1()
          .then ->
            expect(@cy.queue.names()).to.deep.eq ["nest1", "nest2", "noop", "then", "then"]

      it "works with multiple nested commands", ->
        @Cypress.Commands.add "multiple", =>
          @cy
            .url()
            .location()
            .noop()

        @cy
          .multiple()
          .then ->
            expect(@cy.queue.names()).to.deep.eq ["multiple", "url", "location", "noop", "then", "then"]

    describe "custom commands", ->
      beforeEach ->
        @Cypress.Commands.add "dashboard.selectRenderer", =>
          @cy
            # .chain()
            .get("[contenteditable]")
            .first()

        @Cypress.Commands.add "login", {prevSubject: true}, (subject, email) =>
          @cy
            # .chain()
            .wrap(subject.find("input:first"))
            .type(email)

      it "works with custom commands", ->
        input = @cy.$$("input:first")

        @cy
          .get("input:first")
          .parent()
          .cmd("login", "brian@foo.com").then ($input) ->
            expect($input.get(0)).to.eq(input.get(0))

      it "works with namespaced commands", ->
        ce = @cy.$$("[contenteditable]").first()

        @cy
          .command("dashboard.selectRenderer").then ($ce) ->
            expect($ce.get(0)).to.eq(ce.get(0))

      describe "parent commands", ->
        it "ignores existing subject", ->
          @Cypress.Commands.add "bar", (arg1, arg2) ->
            return [arg1, arg2]

          cy.wrap("foo").bar(1, 2).then (arr) ->
            expect(arr).to.deep.eq([1, 2])

      describe "child commands", ->
        beforeEach ->
          @Cypress.Commands.add "c", {prevSubject: true}, (subject, arg) =>
            return @cy.wrap([subject, arg])

          @Cypress.Commands.add "c2", {prevSubject: true},  (subject, arg) =>
            return [subject, arg]

          @Cypress.Commands.add "dom", {prevSubject: "dom"}, (subject, arg) =>
            debugger

        it "inherits subjects", ->
          @cy
            .wrap("foo")
            .c("bar")
            .then (arr) ->
              expect(arr).to.deep.eq(["foo", "bar"])

              return null
            .c("baz")
            .then (arr) ->
              expect(arr).to.deep.eq([null, "baz"])
            .wrap("foo2")
            .c2("bar2")
            .then (arr) ->
              expect(arr).to.deep.eq(["foo2", "bar2"])

              return null
            .c("baz2")
            .then (arr) ->
              expect(arr).to.deep.eq([null, "baz2"])

        it "fails when calling child command before parent", (done) ->
          @allowErrors()

          @cy.on "fail", (err) ->
            expect(err.message).to.include("Oops, it looks like you are trying to call a child command before running a parent command")
            expect(err.message).to.include("cy.c()")
            done()

          @cy.wrap("foo")
          @cy.c()

        it "fails when previous subject isnt DOM", (done) ->
          @allowErrors()

          @cy.on "fail", (err) ->
            expect(err.message).to.include("Cannot call cy.dom() on a non-DOM subject.")
            done()

          @cy.wrap("foo").dom()

      describe "dual commands", ->
        beforeEach ->
          @Cypress.Commands.add "d", {prevSubject: "optional"}, (subject, arg) =>
            @cy.wrap([subject, arg])

        it "passes on subject when used as a child", ->
          @cy
            .wrap("foo")
            .d("bar")
            .then (arr) ->
              expect(arr).to.deep.eq(["foo", "bar"])

        it "has an undefined subject when used as a parent", ->
          @cy
            .d("bar")
            .then (arr) ->
              expect(arr).to.deep.eq([undefined, "bar"])

        it "has an undefined subject as a parent with a previous parent", ->
          @cy.wrap("foo")
          @cy
            .d("bar")
            .then (arr) ->
              expect(arr).to.deep.eq([undefined, "bar"])
            .wrap("foo")
            .d("bar")
            .then (arr) ->
              expect(arr).to.deep.eq(["foo", "bar"])

              return null
            .d("baz")
            .then (arr) ->
              expect(arr).to.deep.eq([null, "baz"])

    describe "overwrite custom commands", ->
      beforeEach ->
        @Cypress.Commands.overwrite "wrap", (orig, arg1) ->
          return orig("foo" + arg1)

        @Cypress.Commands.overwrite "first", (orig, subject) ->
          subject = $([1, 2])

          return orig(subject)

      it "can modify parent commands", ->
        @cy.on "fail", (err) -> debugger

        @cy.wrap("bar").then (str) ->
          expect(str).to.eq("foobar")

      it "can modify child commands", ->
        @cy.get("li").first().then (el) ->
          expect(el[0]).to.eq(1)

      it "overwrites only once", ->
        @Cypress.Commands.overwrite "wrap", (orig, arg1) ->
          return orig(arg1 + "baz")

        @cy.wrap("bar").should("eq", "barbaz")

      it "errors when command does not exist", ->
        @allowErrors()

        fn = =>
          @Cypress.Commands.overwrite "foo", ->

        expect(fn).to.throw("Cannot overwite command for: 'foo'. An existing command does not exist by that name.")

    describe "cancelling promises", ->
      it "cancels via a delay", (done) ->
        pending = Promise.pending()

        promise = Promise.delay(0).cancellable().then ->
          done("not cancelled")
        .caught Promise.CancellationError, (err) ->
          done()

        promise.cancel()
