getNames = (queue) ->
  _(queue).pluck("name")

describe "Cypress API", ->
  beforeEach ->
    Cypress.start()

  afterEach ->
    Cypress.restore()

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
        Cypress.set(@test)

        Cypress.add "nested", ->
          cy.url()

        cy
          .inspect()
          .nested()
          .noop()
          .then -> fn()

      loadFixture("html/generic").done (iframe) =>
        Cypress.setup(window, $(iframe), {}, ->)

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
      Cypress.set(@test)

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
      Cypress.set(@test)

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