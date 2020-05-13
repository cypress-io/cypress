$ = Cypress.$.bind(Cypress)
_ = Cypress._

describe "src/cy/commands/actions/hover", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#hover", ->
    it "throws when invoking", (done) ->
      cy.on "fail", (err) ->
        expect(err.message).to.include "`cy.hover()` is not currently implemented."
        expect(err.docsUrl).to.eq "https://on.cypress.io/hover"
        done()

      cy.get("button").hover()
