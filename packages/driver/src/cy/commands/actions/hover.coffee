$errUtils = require("../../../cypress/error_utils")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: "element" }, {
    hover: (args) ->
      $errUtils.throwErrByPath("hover.not_implemented")
  })
