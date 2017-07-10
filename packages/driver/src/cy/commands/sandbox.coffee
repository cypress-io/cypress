sinon = require("sinon")

$Cy = require("../../cypress/cy")
sinonUtils = require("../../cypress/sinon")

createSandbox = (sinon) ->
  sinonUtils.override(sinon)

  sinon.sandbox.create()

$Cy.extend({
  ## think about making this "public" so
  ## users can utilize the root sandbox
  ## for clocks / special XHRs / etc
  _getSandbox: ->
    sandbox = @state("sandbox") ? createSandbox(sinon)

    @state("sandbox", sandbox)
})

module.exports = (Cypress, Commands) ->
  Cypress.on "restore", ->
    ## restore the sandbox if we've created one
    return if not @state

    if sandbox = @state("sandbox")
      sandbox.restore()
