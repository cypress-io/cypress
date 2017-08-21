describe "foo", ->
  it "bar", ->
    setTimeout ->
      foo.bar()
    , 10

    cy.wait(1000)
