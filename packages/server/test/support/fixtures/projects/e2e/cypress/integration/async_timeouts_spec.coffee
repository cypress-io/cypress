describe "async", ->
  it.only "bar fails", (done) ->
    @timeout(100)

    cy.on "test:fail", ->

    ## async caught fail
    foo.bar()
