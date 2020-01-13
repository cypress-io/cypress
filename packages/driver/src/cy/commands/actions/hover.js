$utils = require("../../../cypress/utils")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: "element" }, {
    hover: (args) ->
      $utils.throwErrByPath("hover.not_implemented")
  })
