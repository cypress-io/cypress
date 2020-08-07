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

  it "quux7 fails", (done) ->
    setTimeout ->
      foo.bar()
    , 0

  it "quux7b fails", (done) ->
    window.top.setTimeout ->
      foo.bar()
    , 0

  it "quux7c fails", (done) ->
    setImmediate ->
      foo.bar()

  # bad, doesn't log to console, unlike Promiser unhandled rejections
  it "quux7d fails", (done) ->
    window.top.setImmediate ->
      foo.bar()

  # # bad, doesn't log to console, unlike Promiser unhandled rejections
  # it "quux7d ii fails", (done) ->
  #   cy.on "uncaught:exception", -> false
  #   window.top.setImmediate ->
  #     foo.bar()

  it "quux7e fails", (done) ->
    requestAnimationFrame ->
      foo.bar()

  it "quux7f fails", (done) ->
    window.top.requestAnimationFrame ->
      foo.bar()

  # bad
  it "quux8 fails", (done) ->
    Cypress.Promise.resolve()
    .then ->
      foo.bar()

    return

  it "quux8b fails", (done) ->
    Promise.resolve()
    .then ->
      foo.bar()

    return

  it "quux8c fails", (done) ->
    window.top.Promise.resolve()
    .then ->
      foo.bar()

    return
