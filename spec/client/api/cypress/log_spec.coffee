describe "$Cypress.Log API", ->

  describe "instances", ->
    beforeEach ->
      @Cypress = $Cypress.create()
      @log = new $Cypress.Log @Cypress

    it "sets state to pending by default", ->
      expect(@log.attributes).to.deep.eq {state: "pending"}

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

    it "#snapshot", ->
      createSnapshot = @sandbox.stub @Cypress, "createSnapshot"

      div = $("<div />")
      @log.set "$el", div

      @log.snapshot()

      expect(createSnapshot).to.be.calledWith div

    it "#error", ->
      err = new Error
      @log.error(err)
      expect(@log.get("state")).to.eq "error"
      expect(@log.get("error")).to.eq err

    it "#error triggers attrs:changed", (done) ->
      @log.on "attrs:changed", (attrs) ->
        expect(attrs.state).to.eq "error"
        done()

      @log.error({})

    it "#end", ->
      @log.end()
      expect(@log.get("state")).to.eq "success"

    it "#end triggers attrs:changed", (done) ->
      @log.on "attrs:changed", (attrs) ->
        expect(attrs.state).to.eq "success"
        done()

      @log.end()

    describe "#set", ->
      it "string", ->
        @log.set "foo", "bar"
        expect(@log.attributes.foo).to.eq "bar"

      it "object", ->
        @log.set {foo: "bar", baz: "quux"}
        expect(@log.attributes).to.deep.eq {foo: "bar", baz: "quux", state: "pending"}

      it "triggers attrs:changed with attribues", (done) ->
        @log.on "attrs:changed", (attrs) =>
          expect(attrs.foo).to.eq "bar"
          expect(attrs.baz).to.eq "quux"
          expect(attrs).to.deep.eq @log.attributes
          done()

        @log.set {foo: "bar", baz: "quux"}

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

    describe "#constructor", ->
      it "snapshots if snapshot attr is true", ->
        createSnapshot = @sandbox.stub @Cypress, "createSnapshot"

        new $Cypress.Log @Cypress, snapshot: true

        expect(createSnapshot).to.be.called

      it "ends if end attr is true", ->
        end = @sandbox.stub $Cypress.Log.prototype, "end"

        new $Cypress.Log @Cypress, end: true

        expect(end).to.be.called

      it "errors if error attr is defined", ->
        error = @sandbox.stub $Cypress.Log.prototype, "error"

        err = new Error

        new $Cypress.Log @Cypress, error: err

        expect(error).to.be.calledWith err

    describe "#wrapOnConsole", ->
      it "automatically adds Command with name", ->
        @log.set("name", "foo")
        @log.set("onConsole", -> {bar: "baz"})
        @log.wrapOnConsole()
        expect(@log.attributes.onConsole()).to.deep.eq {
          Command: "foo"
          bar: "baz"
        }

      it "automatically adds Event with name", ->
        @log.set({name: "foo", event: true})
        @log.set("onConsole", -> {bar: "baz"})
        @log.wrapOnConsole()
        expect(@log.attributes.onConsole()).to.deep.eq {
          Event: "foo"
          bar: "baz"
        }

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
        m = new Backbone.Model
        m.listenTo @interface, "foo", done
        @log.trigger "foo"

      it "#off", ->
        @log.on "foo", ->
        expect(@log._events).not.to.be.empty
        @interface.off "foo"
        expect(@log._events).to.be.empty

  describe "class methods", ->
    enterCommandTestingMode()

    context ".log", ->
      describe "defaults", ->
        beforeEach ->
          obj = {name: "foo", ctx: @cy, fn: (->), args: [1,2,3], type: "parent"}
          @cy.prop("current", obj)

        it "sets name to current.name", (done) ->
          @Cypress.on "log", (obj) ->
            expect(obj.get("name")).to.eq "foo"
            done()

          @Cypress.command({})

        it "sets type to current.type", (done) ->
          @Cypress.on "log", (obj) ->
            expect(obj.get("type")).to.eq "parent"
            done()

          @Cypress.command({})

        it "sets message to stringified args", (done) ->
          @Cypress.on "log", (obj) ->
            expect(obj.get("message")).to.deep.eq "1, 2, 3"
            done()

          @Cypress.command({})

        it "omits ctx from current.ctx", (done) ->
          @Cypress.on "log", (obj) ->
            expect(obj.get("ctx")).not.to.exist
            done()

          @Cypress.command({})

        it "omits fn from current.fn", (done) ->
          @Cypress.on "log", (obj) ->
            expect(obj.get("fn")).not.to.exist
            done()

          @Cypress.command({})

        it "sets hookName to prop hookName", (done) ->
          @cy.private("hookName", "beforeEach")

          @Cypress.on "log", (obj) ->
            expect(obj.get("hookName")).to.eq "beforeEach"
            @private("hookName", null)
            done()

          @Cypress.command({})

        it "sets viewportWidth to private viewportWidth", (done) ->
          @cy.private("viewportWidth", 999)

          @Cypress.on "log", (obj) ->
            expect(obj.get("viewportWidth")).to.eq 999
            done()

          @Cypress.command({})

        it "sets viewportHeight to private viewportHeight", (done) ->
          @cy.private("viewportHeight", 888)

          @Cypress.on "log", (obj) ->
            expect(obj.get("viewportHeight")).to.eq 888
            done()

          @Cypress.command({})

        it "sets testId to runnable.id", (done) ->
          @cy.private("runnable", {id: 123})

          @Cypress.on "log", (obj) ->
            expect(obj.get("testId")).to.eq 123
            @private("runnable", null)
            done()

          @Cypress.command({})

        it "sets numElements if $el", (done) ->
          $el = @cy.$("body")

          @Cypress.on "log", (obj) ->
            expect(obj.get("numElements")).to.eq 1
            done()

          @Cypress.command($el: $el)

        it "sets highlightAttr if $el", (done) ->
          $el = @cy.$("body")

          @Cypress.on "log", (obj) ->
            expect(obj.get("highlightAttr")).not.to.be.undefined
            expect(obj.get("highlightAttr")).to.eq @Cypress.highlightAttr
            done()

          @Cypress.command($el: $el)

      it "displays 0 argument", (done) ->
        @Cypress.on "log", (obj) ->
          if obj.get("name") is "eq"
            expect(obj.get("message")).to.eq "0"
            done()

        @cy.get("div").eq(0)

      it "sets type to 'parent' dual commands when first command", (done) ->
        @allowErrors()

        @Cypress.on "log", (obj) ->
          if obj.get("name") is "then"
            expect(obj.get("type")).to.eq "parent"
            done()

        @cy.then ->
          throw new Error("then failure")

      it "sets type to 'child' dual commands when first command", (done) ->
        @allowErrors()

        @Cypress.on "log", (obj) ->
          if obj.get("name") is "then"
            expect(obj.get("type")).to.eq "child"
            done()

        @cy.noop({}).then ->
          throw new Error("then failure")

      describe "errors", ->
        beforeEach ->
          @allowErrors()

          @cy.on "command:start", ->
            @_timeout(100)

          ## prevent accidentally adding a .then to @cy
          return null

        it "preserves errors", (done) ->
          @Cypress.on "log", (@log) =>

          @cy.on "fail", (err) =>
            expect(@log.get("name")).to.eq "get"
            expect(@log.get("message")).to.eq "foo"
            expect(@log.get("error")).to.eq err
            done()

          @cy.get("foo")

        it "#onConsole for parent commands", (done) ->
          @Cypress.on "log", (@log) =>

          @cy.on "fail", (err) =>
            expect(@log.attributes.onConsole()).to.deep.eq {
              Command: "get"
              Returned: undefined
              Error: err.toString()
            }
            done()

          @cy.get("foo")

        it "#onConsole for dual commands as a parent", (done) ->
          @Cypress.on "log", (@log) =>

          @cy.on "fail", (err) =>
            expect(@log.attributes.onConsole()).to.deep.eq {
              Command: "wait"
              Error: err.toString()
            }
            done()

          @cy.wait ->
            expect(true).to.be.false

        it "#onConsole for dual commands as a child", (done) ->
          @Cypress.on "log", (@log) =>

          @cy.on "fail", (err) =>
            if @log.get("name") is "wait"
              btns = getFirstSubjectByName.call(@, "get")
              expect(@log.attributes.onConsole()).to.deep.eq {
                Command: "wait"
                "Applied To": $Cypress.Utils.getDomElements(btns)
                Error: err.toString()
              }
              done()

          @cy.get("button").wait ->
            expect(true).to.be.false

        it "#onConsole for children commands", (done) ->
          @Cypress.on "log", (@log) =>

          @cy.on "fail", (err) =>
            if @log.get("name") is "contains"
              btns = getFirstSubjectByName.call(@, "get")
              expect(@log.attributes.onConsole()).to.deep.eq {
                Command: "contains"
                Content: "asdfasdfasdfasdf"
                "Applied To": $Cypress.Utils.getDomElements(btns)
                Error: err.toString()
              }
              done()

          @cy.get("button").contains("asdfasdfasdfasdf")

        it "#onConsole for nested children commands", (done) ->
          @Cypress.on "log", (@log) =>

          @cy.on "fail", (err) =>
            if @log.get("name") is "contains"
              expect(@log.attributes.onConsole()).to.deep.eq {
                Command: "contains"
                Content: "asdfasdfasdfasdf"
                "Applied To": getFirstSubjectByName.call(@, "eq").get(0)
                Error: err.toString()
              }
              done()

          @cy.get("button").eq(0).contains("asdfasdfasdfasdf")