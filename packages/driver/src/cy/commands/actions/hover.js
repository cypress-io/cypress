/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $errUtils = require("../../../cypress/error_utils");

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({ prevSubject: "element" }, {
  hover(args) {
    return $errUtils.throwErrByPath("hover.not_implemented");
  }
});
