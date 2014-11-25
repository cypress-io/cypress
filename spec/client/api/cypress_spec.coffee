getNames = (queue) ->
  _(queue).pluck("name")

describe "Cypress API", ->
  beforeEach ->
    loadFixture("html/generic").done (iframe) =>
      Cypress.start()
      Cypress.setup(window, $(iframe), {}, ->)

  afterEach ->
    Cypress.restore()

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

    it "queues in the correct order", ->
      @setup ->
        expect(getNames(cy.queue)).to.deep.eq ["inspect", "nested", "url", "noop", "then", "then"]

    it "nested command should reference url as next property", ->
      @setup ->
        nested = _(cy.queue).find (obj) -> obj.name is "nested"
        expect(nested.next.name).to.eq "url"

    it "null outs nestedIndex prior to restoring", (done) ->
      @setup ->
        _.defer ->
          expect(cy.nestedIndex).to.be.null
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