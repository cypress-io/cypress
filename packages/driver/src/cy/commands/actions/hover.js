/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $utils = require("../../../cypress/utils");

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({ prevSubject: "element" }, {
  hover(args) {
    return $utils.throwErrByPath("hover.not_implemented");
  }
});
