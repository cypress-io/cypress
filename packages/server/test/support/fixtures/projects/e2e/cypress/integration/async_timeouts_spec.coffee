describe "async", ->
  it "bar fails", (done) ->
    @timeout(100)

    cy.on "fail", ->

    ## async caught fail
    foo.bar()

  it "fails async after cypress command", (done) ->
    @timeout(100)

    cy.wait(0)
