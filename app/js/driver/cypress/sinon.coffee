do ($Cypress) ->

  $Cypress.Sinon = {
    override: (sinon) ->
      ## monkey-patch call.toString() so that it doesn't include stack
      sinon.spyCall = _.wrap sinon.spyCall, (orig, args...) ->
        call = orig(args...)
        call.toString = _.wrap call.toString, (orig) ->
          stack = call.stack
          call.stack = null
          ret = orig.call(call)
          call.stack = stack
          return ret
        return call

      sinon.format = $Cypress.Utils.stringifyArg.bind(Cypress.Utils)
  }
