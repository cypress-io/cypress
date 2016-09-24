describe "ending early",  ->
  it "does not end early", ->

  it "does end early", (done) ->
    cy
      .noop({})
      .then ->
        Cypress.Promise.delay(1000)
      .noop({})
      .wrap({})

    setTimeout ->
      done()
    , 500