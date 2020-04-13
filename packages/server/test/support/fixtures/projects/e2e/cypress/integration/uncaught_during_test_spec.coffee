describe "foo", ->
  it "fails with setTimeout", ->
    setTimeout ->
      foo.bar()
    , 10

    cy.wait(1000)

  it "fails with setTimeout and done", (done) ->
    setTimeout ->
      foo.bar()

  it "passes with fail handler after failing with setTimeout", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.include("foo is not defined")

      setTimeout -> done()

      return false

    setTimeout ->
      foo.bar()

  it "fails with async app code error", ->
    cy.visit("/js_errors.html")
    cy.get(".async-error").click()
    cy.wait(10000)

  it "passes with fail handler after failing with async app code error", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.include("qax is not defined")
      expect(err.stack).to.include("qax is not defined")

      setTimeout -> done()

      return false

    cy.visit("/js_errors.html")
    cy.get(".async-error").click()
    cy.wait(10000)

  ## FIXME: Currently times out but doesn't display the error
  it.skip "fails with promise", ->
    setTimeout ->
      foo.bar()

    new Promise(->)
