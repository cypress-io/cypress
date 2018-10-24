statuses = require("http-status-codes")

isOkStatusCodeRe = /^[2|3]\d+$/

module.exports = {
  isOk: (code) ->
    code and isOkStatusCodeRe.test(code)

  ## TODO: test this method
  getText: (code) ->
    try
      statuses.getStatusText(code)
    catch e
      "Unknown Status Code"
}