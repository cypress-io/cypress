testAfterRunEvent = false

Cypress.on "test:after:run", (obj) ->
  if obj.title is "does not run"
    testAfterRunEvent = true

describe "foo", ->
  before ->
    setTimeout ->
      foo.bar()
    , 10

    cy.wait(1000)

  it "does not run", ->

describe "bar", ->
  it "runs", ->
    expect(testAfterRunEvent).to.be.true
