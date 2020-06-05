/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const path = require("path");

module.exports = (onFn, config) => onFn("before:browser:launch", function(browser = {}, options) {
  const pathToExt = path.resolve("ext");

  options.args.push(`--load-extension=${pathToExt}`);
  return options;
});
