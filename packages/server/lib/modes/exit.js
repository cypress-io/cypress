/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _       = require("lodash");
const Promise = require("bluebird");

module.exports = options =>
  Promise.try(() => _.toNumber(options.exitWithCode))
;
