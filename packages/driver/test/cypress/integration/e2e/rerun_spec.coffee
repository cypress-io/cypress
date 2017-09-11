## NOTE: we could clean up this test a lot
## by probably using preserve:run:state event
## or by using localstorage

## store these on our outer top window
## so they are globally preserved
window.top.hasRunOnce ?= false
window.top.previousHash ?= window.top.location.hash

describe "rerun state bugs", ->
  it "stores viewport globally and does not hang on re-runs", ->
    ## NOTE: there's probably other ways to cause a re-run
    ## event more programatically (like firing it through Cypress)
    ## but we get the hashchange coverage for free on this.

    cy.viewport(500, 500).then ->
      if not window.top.hasRunOnce
        ## turn off mocha events for a second
        Cypress.config("isTextTerminal", false)

        ## 1st time around
        window.top.hasRunOnce = true

        ## cause a rerun event to occur
        ## by changing the hash
        hash = window.top.location.hash
        window.top.location.hash = hash + "?rerun"
      else
        if window.top.location.hash is window.top.previousHash
          ## 3rd time around
          ## let the mocha end events fire
          Cypress.config("isTextTerminal", true)
        else
          ## our test has already run so remove
          ## the query param
          ## 2nd time around
          window.top.location.hash = window.top.previousHash
