getNames = (queue) ->
  _(queue).pluck("name")

describe "Cypress API", ->
  before ->
    Cypress.start()

  beforeEach ->
    Cypress.set(@test)

    loadFixture("html/dom").done (iframe) =>
      Cypress.setup(runner, $(iframe), {}, ->)

  # afterEach ->
  #   Cypress.restore()

  # after ->
  #   Cypress.stop()

  context "invoke", ->
    it "returns a promise", ->
      cy.type("foo")

  context "#isReady", ->
    it "creates a deferred when not ready", ->
      cy.isReady(false)
      expect(cy.prop("ready")).to.have.keys("promise", "resolve", "reject")

    it "resolves the deferred when ready", ->
      cy.isReady(false)
      cy.isReady(true)
      expect(cy.prop("ready").promise.isResolved()).to.be.true

  context "#invoke", ->
    it "fires onInvoke once the promise is set", ->
      cy.pause(1000)
      cy.onInvoke = (obj)

  context.only ".abort", ->
    it "cancels any open promise", (done) ->
      cy.pause(1000)
      cy.on "set", (obj) ->
        debugger
        Cypress.abort()

  context ".restore", ->
    it "calls stopListening", ->


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
      @setup ->
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