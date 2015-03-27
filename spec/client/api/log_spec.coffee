describe "Cypress.Log API", ->

  describe "instances", ->
    beforeEach ->
      @log = new Cypress.Log

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
      createSnapshot = @sandbox.stub Cypress, "createSnapshot"

      @log.set "$el", {}

      @log.snapshot()

      expect(createSnapshot).to.be.calledWith {}

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
        setElAttrs = @sandbox.stub Cypress.Log.prototype, "setElAttrs"

        new Cypress.Log $el: {}

        expect(setElAttrs).to.be.called

      it "is called if $el is passed during #set", ->
        setElAttrs = @sandbox.stub Cypress.Log.prototype, "setElAttrs"

        log = new Cypress.Log
        log.set $el: {}

        expect(setElAttrs).to.be.called

      it "sets $el", ->
        log = new Cypress.Log $el: @$el
        expect(log.get("$el")).to.eq @$el

      it "sets highlightAttr", ->
        @log.set($el: @$el)
        expect(@log.get("highlightAttr")).to.be.ok
        expect(@log.get("highlightAttr")).to.eq Cypress.highlightAttr

      it "sets numElements", ->
        @log.set($el: @$el)
        expect(@log.get("numElements")).to.eq @$el.length

    describe "#constructor", ->
      it "snapshots if snapshot attr is true", ->
        createSnapshot = @sandbox.stub Cypress, "createSnapshot"

        new Cypress.Log snapshot: true

        expect(createSnapshot).to.be.called

      it "ends if end attr is true", ->
        end = @sandbox.stub Cypress.Log.prototype, "end"

        new Cypress.Log end: true

        expect(end).to.be.called

      it "errors if error attr is defined", ->
        error = @sandbox.stub Cypress.Log.prototype, "error"

        err = new Error

        new Cypress.Log error: err

        expect(error).to.be.calledWith err

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
