describe "Cypress.Log API", ->

  describe "instances", ->
    beforeEach ->
      @log = new Cypress.Log

    it "sets state to pending by default", ->
      expect(@log.attributes).to.deep.eq {state: "pending"}

    it "#set string", ->
      @log.set "foo", "bar"
      expect(@log.attributes.foo).to.eq "bar"

    it "#set object", ->
      @log.set {foo: "bar", baz: "quux"}
      expect(@log.attributes).to.deep.eq {foo: "bar", baz: "quux", state: "pending"}

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
