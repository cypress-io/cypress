{ $, _, Promise } = window.testUtils

describe "$Cypress.Log API", ->

  describe "instances", ->
    beforeEach ->
      @Cypress = $Cypress.create()
      @Cypress.setConfig({})
      @log = new $Cypress.Log @Cypress

    it "sets state to pending by default", ->
      expect(@log.attributes).to.deep.eq {
        id: @log.get("id")
        state: "pending"
      }

    it "#get", ->
      @log.set "bar", "baz"
      expect(@log.get("bar")).to.eq "baz"

    it "#pick", ->
      @log.set "one", "one"
      @log.set "two", "two"

      expect(@log.pick("one", "two")).to.deep.eq {
        one: "one"
        two: "two"
      }

    it "#error", ->
      err = new Error
      @log.error(err)
      expect(@log.get("state")).to.eq "failed"
      expect(@log.get("error")).to.eq err

    it "#error sets ended true and cannot be set back to passed", ->
      err = new Error
      @log.error(err)
      expect(@log.get("ended")).to.be.true
      @log.end()
      expect(@log.get("state")).to.eq "failed"
      expect(@log.get("error")).to.eq err

    it "#error triggers log:state:changed", (done) ->
      @Cypress.on "log:state:changed", (attrs) ->
        expect(attrs.state).to.eq "failed"
        done()

      $Cypress.Log.addToLogs(@log)

      @log._hasInitiallyLogged = true

      @log.error({})

    it "#end", ->
      @log.end()
      expect(@log.get("state")).to.eq "passed"

    it "#end triggers log:state:changed", (done) ->
      @Cypress.on "log:state:changed", (attrs) ->
        expect(attrs.state).to.eq "passed"
        done()

      $Cypress.Log.addToLogs(@log)

      @log._hasInitiallyLogged = true

      @log.end()

    it "does not emit log:state:changed until after first log event", ->
      logged  = 0
      changed = 0

      @log.set("foo", "bar")

      @Cypress.on "log", ->
        logged += 1

      @Cypress.on "log:state:changed", ->
        changed += 1

      Promise.delay(30)
      .then =>
        expect(logged).to.eq(0)
        expect(changed).to.eq(0)

        $Cypress.Log.addToLogs(@log)

        @log._hasInitiallyLogged = true

        @log.set("bar", "baz")
        @log.set("baz", "quux")

        Promise.delay(30)
        .then =>
          expect(changed).to.eq(1)

    it "only emits log:state:changed when attrs have actually changed", ->
      logged  = 0
      changed = 0

      $Cypress.Log.addToLogs(@log)

      @log._hasInitiallyLogged = true

      @Cypress.on "log", ->
        logged += 1

      @Cypress.on "log:state:changed", ->
        changed += 1

      @log.set("foo", "bar")

      Promise.delay(30)
      .then =>
        expect(changed).to.eq(1)

        @log.get("foo", "bar")

        Promise.delay(30)
        .then =>
          expect(changed).to.eq(1)

    describe "#toJSON", ->
      it "serializes to object literal", ->
        @log.set({
          foo: "bar"
          consoleProps: ->
            {
              a: "b"
            }
          renderProps: ->
            {
              c: "d"
            }
        })

        expect(@log.toJSON()).to.deep.eq({
          id: @log.get("id")
          foo: "bar"
          state: "pending"
          err: null
          consoleProps: { Command: undefined, a: "b" }
          renderProps: { c: "d" }
        })

      it "sets defaults for consoleProps + renderProps", ->
        @log.set({
          foo: "bar"
        })

        expect(@log.toJSON()).to.deep.eq({
          id: @log.get("id")
          foo: "bar"
          state: "pending"
          err: null
          consoleProps: {  }
          renderProps: {  }
        })

      it "wraps onConsole for legacy purposes", ->
        @log.set({
          foo: "bar"
          onConsole: ->
            {
              a: "b"
            }
        })

        expect(@log.toJSON()).to.deep.eq({
          id: @log.get("id")
          foo: "bar"
          state: "pending"
          err: null
          consoleProps: { Command: undefined, a: "b" }
          renderProps: {  }
        })

      it "serializes error", ->
        err = new Error("foo bar baz")

        @log.error(err)

        expect(@log.toJSON()).to.deep.eq({
          id: @log.get("id")
          state: "failed"
          ended: true
          err: {
            message: err.message
            name: err.name
            stack: err.stack
          }
          consoleProps: {  }
          renderProps: {  }
          ended: true
        })

      it "defaults consoleProps with error stack", ->
        err = new Error("foo bar baz")

        @log.set({
          consoleProps: ->
            {foo: "bar"}
        })

        @log.error(err)

        expect(@log.toJSON()).to.deep.eq({
          id: @log.get("id")
          state: "failed"
          ended: true
          err: {
            message: err.message
            name: err.name
            stack: err.stack
          }
          consoleProps: {
            Command: undefined
            Error: err.stack
            foo: "bar"
          }
          renderProps: {  }
          ended: true
        })

      it "sets $el", ->
        div = $("<div />")
        @log.set("$el", div)

        toJSON = @log.toJSON()

        expect(toJSON.$el).to.eq(div)

    describe "#toSerializedJSON", ->
      it "serializes simple properties over the wire", ->
        div = $("<div />")

        @log.set({
          foo: "foo"
          bar: true
          $el: div
          arr: [1,2,3]
          snapshots: []
          consoleProps: ->
            {foo: "bar"}
        })

        expect(@log.get("snapshots")).to.be.an("array")

        expect(@Cypress.Log.toSerializedJSON(@log.toJSON())).to.deep.eq({
          $el: "<div>"
          arr: [1,2,3]
          bar: true
          consoleProps: {
            Command: undefined
            foo: "bar"
          }
          err: null
          foo: "foo"
          highlightAttr: "data-cypress-el"
          id: @log.get("id")
          numElements: 1
          renderProps: {}
          snapshots: null
          state: "pending"
          visible: false
        })

      it "serializes window", ->
        @log.set({
          consoleProps: ->
            Yielded: window
        })

        expect(@Cypress.Log.toSerializedJSON(@log.toJSON())).to.deep.eq({
          consoleProps: {
            Command: undefined
            Yielded: "<window>"
          }
          err: null
          id: @log.get("id")
          renderProps: {}
          state: "pending"
        })

      it "serializes document", ->
        @log.set({
          consoleProps: ->
            Yielded: document
        })

        expect(@Cypress.Log.toSerializedJSON(@log.toJSON())).to.deep.eq({
          consoleProps: {
            Command: undefined
            Yielded: "<document>"
          }
          err: null
          id: @log.get("id")
          renderProps: {}
          state: "pending"
        })

      it "serializes an array of elements", ->
        img1 = $("<img />")
        img2 = $("<img />")
        imgs = img1.add(img2)

        @log.set({
          $el: imgs
          consoleProps: ->
            Yielded: [img1, img2]
        })

        expect(@Cypress.Log.toSerializedJSON(@log.toJSON())).to.deep.eq({
          consoleProps: {
            Command: undefined
            Yielded: ["<img>", "<img>"]
          }
          $el: "[ <img>, 1 more... ]"
          err: null
          highlightAttr: "data-cypress-el"
          id: @log.get("id")
          numElements: 2
          renderProps: {}
          state: "pending"
          visible: false
        })

    describe "#set", ->
      it "string", ->
        @log.set "foo", "bar"
        expect(@log.attributes.foo).to.eq "bar"

      it "object", ->
        @log.set {foo: "bar", baz: "quux"}
        expect(@log.attributes).to.deep.eq {
          id: @log.get("id")
          foo: "bar"
          baz: "quux"
          state: "pending"
        }

      it "triggers log:state:changed with attribues", (done) ->
        @Cypress.on "log:state:changed", (attrs, log) =>
          expect(attrs.foo).to.eq "bar"
          expect(attrs.baz).to.eq "quux"
          expect(log).to.eq(@log)
          done()

        $Cypress.Log.addToLogs(@log)

        @log._hasInitiallyLogged = true
        @log.set({foo: "bar", baz: "quux"})

      it "debounces log:state:changed and only fires once", ->
        count = 0

        @Cypress.on "log:state:changed", (attrs, log) =>
          count += 1

          expect(attrs.foo).to.eq "quux"
          expect(attrs.a).to.eq "b"
          expect(attrs.c).to.eq "d"
          expect(attrs.e).to.eq "f"
          expect(log).to.eq(@log)

        $Cypress.Log.addToLogs(@log)

        @log._hasInitiallyLogged = true

        @log.set({foo: "bar", a: "b"})
        @log.set({foo: "baz", c: "d"})

        @log.set {foo: "quux", e: "f"}

        Promise.delay(100)
        .then ->
          expect(count).to.eq(1)

    describe "#setElAttrs", ->
      beforeEach ->
        @$el = $("<div />").appendTo($("body"))

      afterEach ->
        @$el.remove()

      it "is called if $el is passed during construction", ->
        setElAttrs = @sandbox.stub $Cypress.Log.prototype, "setElAttrs"

        new $Cypress.Log @Cypress, $el: {}

        expect(setElAttrs).to.be.called

      it "is called if $el is passed during #set", ->
        setElAttrs = @sandbox.stub $Cypress.Log.prototype, "setElAttrs"

        log = new $Cypress.Log @Cypress
        log.set $el: {}

        expect(setElAttrs).to.be.called

      it "sets $el", ->
        log = new $Cypress.Log @Cypress, $el: @$el
        expect(log.get("$el")).to.eq @$el

      it "sets highlightAttr", ->
        @log.set($el: @$el)
        expect(@log.get("highlightAttr")).to.be.ok
        expect(@log.get("highlightAttr")).to.eq @Cypress.highlightAttr

      it "sets numElements", ->
        @log.set($el: @$el)
        expect(@log.get("numElements")).to.eq @$el.length

      it "sets visible to true", ->
        @$el.css({height: 100, width: 100})
        @log.set($el: @$el)
        expect(@log.get("visible")).to.be.true

      it "sets visible to false", ->
        @$el.hide()
        @log.set($el: @$el)
        expect(@log.get("visible")).to.be.false

      it "sets visible to false if any $el is not visible", ->
        $btn1 = $("<button>one</button>").appendTo($("body"))
        $btn2 = $("<button>two</button>").appendTo($("body")).hide()

        $el = $btn1.add($btn2)
        expect($el.length).to.eq 2

        @log.set($el: $el)

        expect(@log.get("visible")).to.be.false
        $el.remove()

      it "converts raw dom elements to jquery instances", ->
        el = $("<button>one</button").get(0)

        @log.set($el: el)

        expect(@log.get("$el")).to.be.an.instanceof($)
        expect(@log.get("$el").get(0)).to.eq(el)

    describe "#constructor", ->
      it "snapshots if snapshot attr is true", ->
        createSnapshot = @sandbox.stub(@Cypress, "createSnapshot").returns({})

        new $Cypress.Log @Cypress, snapshot: true

        expect(createSnapshot).to.be.called

      it "ends if end attr is true", ->
        end = @sandbox.stub $Cypress.Log.prototype, "end"

        new $Cypress.Log @Cypress, end: true

        expect(end).to.be.called

      it "errors if error attr is defined", ->
        error = @sandbox.stub $Cypress.Log.prototype, "error"

        err = new Error

        new $Cypress.Log(@Cypress, {error: err})

        expect(error).to.be.calledWith err

    describe "#wrapConsoleProps", ->
      it "automatically adds Command with name", ->
        @log.set("name", "foo")
        @log.set("snapshots", [{name: null, body: {}}])
        @log.set("consoleProps", -> {bar: "baz"})
        @log.wrapConsoleProps()
        expect(@log.attributes.consoleProps()).to.deep.eq {
          Command: "foo"
          bar: "baz"
        }

      it "automatically adds Event with name", ->
        @log.set({name: "foo", event: true, snapshot: {}})
        @log.set("consoleProps", -> {bar: "baz"})
        @log.wrapConsoleProps()
        expect(@log.attributes.consoleProps()).to.deep.eq {
          Event: "foo"
          bar: "baz"
        }

      it "adds a note when snapshot is missing", ->
        @log.set("name", "foo")
        @log.set("instrument", "command")
        @log.set("consoleProps", -> {})
        @log.wrapConsoleProps()
        expect(@log.attributes.consoleProps().Snapshot).to.eq "The snapshot is missing. Displaying current state of the DOM."

    describe "#publicInterface", ->
      beforeEach ->
        @interface = @log.publicInterface()

      it "#get", ->
        @log.set "foo", "bar"
        expect(@interface.get("foo")).to.eq "bar"

      it "#pick", ->
        @log.set "bar", "baz"
        expect(@interface.pick("bar")).to.deep.eq {bar: "baz"}

      it "#on", (done) ->
        @log.on "foo", done
        @log.trigger "foo"

      it "#off", ->
        @log.on "foo", ->
        expect(@log._events).not.to.be.empty
        @interface.off "foo"
        expect(@log._events).to.be.empty

    describe "#snapshot", ->
      beforeEach ->
        @sandbox.stub(@Cypress, "createSnapshot").returns({
          body: "body"
          htmlAttrs: {
            class: "foo"
          }
          headStyles: ["body { background: red }"]
          bodyStyles: ["body { margin: 10px }"]
        })

      it "can set multiple snapshots", ->
        @log.snapshot()
        @log.snapshot()

        expect(@log.get("snapshots").length).to.eq(2)

      it "can name the snapshot", ->
        @log.snapshot("logging in")
        expect(@log.get("snapshots").length).to.eq(1)
        expect(@log.get("snapshots")[0].name).to.eq("logging in")

      it "can set multiple named snapshots", ->
        @log.snapshot("one")
        @log.snapshot("two")

        snapshots = @log.get("snapshots")
        expect(snapshots[0].name).to.eq("one")
        expect(snapshots[1].name).to.eq("two")

      it "can insert snapshot at specific position", ->
        @log.snapshot("one")
        @log.snapshot("two")
        @log.snapshot("three")
        @log.snapshot("replacement", {at: 1})

        snapshots = @log.get("snapshots")
        expect(snapshots.length).to.eq(3)
        expect(snapshots[0].name).to.eq("one")
        expect(snapshots[1].name).to.eq("replacement")
        expect(snapshots[2].name).to.eq("three")

      it "can automatically set the name of the next snapshot", ->
        @log.snapshot("before", {next: "after"})
        @log.snapshot("asdfasdf") ## should ignore this name
        @log.snapshot("third")

        snapshots = @log.get("snapshots")
        expect(snapshots.length).to.eq(3)
        expect(snapshots[0].name).to.eq("before")
        expect(snapshots[1].name).to.eq("after")
        expect(snapshots[2].name).to.eq("third")

      it "includes html attributes", ->
        @log.snapshot()
        snapshots = @log.get("snapshots")
        expect(snapshots[0].htmlAttrs).to.eql({
          class: "foo"
        })

      it "includes head styles", ->
        @log.snapshot()
        snapshots = @log.get("snapshots")
        expect(snapshots[0].headStyles).to.eql(["body { background: red }"])

      it "includes body", ->
        @log.snapshot()
        snapshots = @log.get("snapshots")
        expect(snapshots[0].body).to.equal("body")

      it "includes body styles", ->
        @log.snapshot()
        snapshots = @log.get("snapshots")
        expect(snapshots[0].bodyStyles).to.eql(["body { margin: 10px }"])

  describe "class methods", ->
    enterCommandTestingMode()

    context ".create", ->
      beforeEach ->
        @Cypress.Log.create(@Cypress, @cy)

        obj = {name: "foo", ctx: @cy, fn: (->), args: [1,2,3], type: "parent"}
        @cy.state("current", $Cypress.Command.create(obj))

      describe "#command", ->
        it "displays a deprecation warning", ->
          warn = @sandbox.spy console, "warn"
          @Cypress.command({})
          expect(warn).to.be.calledWith "Cypress Warning: Cypress.command() is deprecated. Please update and use: Cypress.Log.command()"

      describe "#log", ->
        it "only emits log:state:changed if attrs have actually changed", (done) ->
          logged  = 0
          changed = 0

          @Cypress.on "log", ->
            logged += 1

          @Cypress.on "log:state:changed", ->
            changed += 1

          log = @Cypress.Log.log("command", {})

          _.delay ->
            expect(logged).to.eq(1)
            expect(changed).to.eq(0)
            done()
          , 30

      context "$Log.log", ->
        it "displays 0 argument", (done) ->
          @Cypress.on "log", (obj) ->
            if obj.name is "eq"
              expect(obj.message).to.eq "0"
              done()

          @cy.get("div").eq(0)

        it "sets type to 'parent' dual commands when first command", (done) ->
          @allowErrors()

          @Cypress.on "log", (obj) ->
            if obj.name is "then"
              expect(obj.type).to.eq "parent"
              done()

          @cy.then ->
            throw new Error("then failure")

        it "sets type to 'child' dual commands when first command", (done) ->
          @allowErrors()

          @Cypress.on "log", (obj) ->
            if obj.name is "then"
              expect(obj.type).to.eq "child"
              done()

          @cy.noop({}).then ->
            throw new Error("then failure")

        describe "defaults", ->
          it "sets name to current.name", (done) ->
            @Cypress.on "log", (obj) ->
              expect(obj.name).to.eq "foo"
              done()

            @Cypress.Log.command({})

          it "sets type to current.type", (done) ->
            @Cypress.on "log", (obj) ->
              expect(obj.type).to.eq "parent"
              done()

            @Cypress.Log.command({})

          it "sets message to stringified args", (done) ->
            @Cypress.on "log", (obj) ->
              expect(obj.message).to.deep.eq "1, 2, 3"
              done()

            @Cypress.Log.command({})

          it "omits ctx from current.ctx", (done) ->
            @Cypress.on "log", (obj) ->
              expect(obj.ctx).not.to.exist
              done()

            @Cypress.Log.command({})

          it "omits fn from current.fn", (done) ->
            @Cypress.on "log", (obj) ->
              expect(obj.fn).not.to.exist
              done()

            @Cypress.Log.command({})

          it "sets hookName to prop hookName", (done) ->
            @cy.state("hookName", "beforeEach")

            @Cypress.on "log", (obj) ->
              expect(obj.hookName).to.eq "beforeEach"
              @state("hookName", null)
              done()

            @Cypress.Log.command({})

          it "sets viewportWidth to private viewportWidth", (done) ->
            @Cypress.config("viewportWidth", 999)

            @Cypress.on "log", (obj) ->
              expect(obj.viewportWidth).to.eq 999
              done()

            @Cypress.Log.command({})

          it "sets viewportHeight to private viewportHeight", (done) ->
            @Cypress.config("viewportHeight", 888)

            @Cypress.on "log", (obj) ->
              expect(obj.viewportHeight).to.eq 888
              done()

            @Cypress.Log.command({})

          it "sets url to private url", (done) ->
            @cy.state("url", "www.github.com")

            @Cypress.on "log", (obj) ->
              expect(obj.url).to.eq "www.github.com"
              done()

            @Cypress.Log.command({})

          it "sets testId to runnable.id", (done) ->
            @cy.state("runnable", {id: 123})

            @Cypress.on "log", (obj) ->
              expect(obj.testId).to.eq 123
              @state("runnable", null)
              done()

            @Cypress.Log.command({})

          it "sets numElements if $el", (done) ->
            $el = @cy.$$("body")

            @Cypress.on "log", (obj) ->
              expect(obj.numElements).to.eq 1
              done()

            @Cypress.Log.command($el: $el)

          it "sets highlightAttr if $el", (done) ->
            $el = @cy.$$("body")

            @Cypress.on "log", (obj) ->
              expect(obj.highlightAttr).not.to.be.undefined
              expect(obj.highlightAttr).to.eq @Cypress.highlightAttr
              done()

            @Cypress.Log.command($el: $el)

        describe "errors", ->
          beforeEach ->
            @allowErrors()

            @cy.on "command:start", ->
              cy.timeout(100)

            ## prevent accidentally adding a .then to @cy
            return null

          it "preserves errors", (done) ->
            @Cypress.on "log", (attrs, @log) =>

            @cy.on "fail", (err) =>
              expect(@log.get("name")).to.eq "get"
              expect(@log.get("message")).to.eq "foo"
              expect(@log.get("error")).to.eq err
              done()

            @cy.get("foo")

          it "#consoleProps for parent commands", (done) ->
            @Cypress.on "log", (attrs, @log) =>

            @cy.on "fail", (err) =>
              expect(@log.attributes.consoleProps()).to.deep.eq {
                Command: "get"
                Selector: "foo"
                Elements: 0
                Yielded: undefined
                Error: err.toString()
              }
              done()

            @cy.get("foo")

          it "#consoleProps for dual commands as a parent", (done) ->
            @Cypress.on "log", (attrs, @log) =>

            @cy.on "fail", (err) =>
              expect(@log.attributes.consoleProps()).to.deep.eq {
                Command: "wait"
                Error: err.toString()
              }
              done()

            @cy.wait ->
              expect(true).to.be.false

          it "#consoleProps for dual commands as a child", (done) ->
            @Cypress.on "log", (attrs, @log) =>

            @cy.on "fail", (err) =>
              if @log.get("name") is "wait"
                btns = getFirstSubjectByName.call(@, "get")
                expect(@log.attributes.consoleProps()).to.deep.eq {
                  Command: "wait"
                  "Applied To": $Cypress.utils.getDomElements(btns)
                  Error: err.toString()
                }
                done()

            @cy.get("button").wait ->
              expect(true).to.be.false

          it "#consoleProps for children commands", (done) ->
            @Cypress.on "log", (attrs, @log) =>

            @cy.on "fail", (err) =>
              if @log.get("name") is "contains"
                btns = getFirstSubjectByName.call(@, "get")
                expect(@log.attributes.consoleProps()).to.deep.eq {
                  Command: "contains"
                  Content: "asdfasdfasdfasdf"
                  Elements: 0
                  Yielded: undefined
                  "Applied To": $Cypress.utils.getDomElements(btns)
                  Error: err.toString()
                }
                done()

            @cy.get("button").contains("asdfasdfasdfasdf")

          ## FIXME: timed out once on full run
          it "#consoleProps for nested children commands", (done) ->
            @Cypress.on "log", (attrs, @log) =>

            @cy.on "fail", (err) =>
              if @log.get("name") is "contains"
                expect(@log.attributes.consoleProps()).to.deep.eq {
                  Command: "contains"
                  Content: "asdfasdfasdfasdf"
                  Elements: 0
                  Yielded: undefined
                  "Applied To": getFirstSubjectByName.call(@, "eq").get(0)
                  Error: err.toString()
                }
                done()

            @cy.get("button").eq(0).contains("asdfasdfasdfasdf")
