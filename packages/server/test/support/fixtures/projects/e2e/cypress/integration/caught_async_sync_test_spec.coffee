describe "foo", ->
  it "baz fails", ->
    ## synchronous caught fail
    foo.bar()

  it "bar fails", (done) ->
    ## async caught fail
    foo.bar()

  it "quux fails", (done) ->
    ## commands caught never calling done
    ## with no fail handler should immediately die
    cy.wrap(null).then ->
      foo.bar()

  it "quux2 fails", (done) ->
    cy.on "fail", ->
      foo.bar()

    ## commands caught never calling done
    ## but have a failing handler should die
    cy.wrap(null).then ->
      foo.bar()

  it "quux3 passes", (done) ->
    cy.on "fail", ->
      done()

    ## commands caught with a fail handler
    ## and call done should pass
    cy.wrap(null).then ->
      foo.bar()

  it "quux4 passes", ->
    cy.on "fail", ->

    ## commands caught with a fail handler
    ## and no done callback will pass if
    ## nothing throws in the fail callback
    cy.wrap(null).then ->
      foo.bar()

  it "quux5 passes", ->
    cy.on "fail", ->

    ## no commands fail handler should pass
    foo.bar()

  it "quux6 passes", (done) ->
    cy.on "fail", ->
      done()

    ## no commands fail async handler should pass
    foo.bar()
