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
      @setup = (fn) =>
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
