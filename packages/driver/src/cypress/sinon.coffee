_ = require("lodash")
$utils = require("./utils")

module.exports = {
  override: (sinon) ->
    spyCall = sinon.spyCall
    ## monkey-patch call.toString() so that it doesn't include stack
    sinon.spyCall = ->
      call = spyCall.apply(@, arguments)

      toString = call.toString

      call.toString = ->
        stack = call.stack
        call.stack = null
        ret = toString.aply(this, arguments)
        call.stack = stack
        return ret

      return call

    sinon.format = $utils.stringifyArg.bind($utils)
  }
