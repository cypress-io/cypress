sinon = require("sinon")

sinonUtils = require("../../cypress/sinon")

createSandbox = (sinon) ->
  sinonUtils.override(sinon)

  sinon.sandbox.create()

create = (Cypress, Commands) ->
  Cypress.on "restore", ->
    ## restore the sandbox if we've created one
    return if not @state

    if sandbox = @state("sandbox")
      sandbox.restore()

  return {
    ## think about making this "public" so
    ## users can utilize the root sandbox
    ## for clocks / special XHRs / etc
    _getSandbox: ->
      sandbox = @state("sandbox") ? createSandbox(sinon)

      @state("sandbox", sandbox)
  }


module.exports = {
  create
}
