/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// returns invalid config with a browser that is invalid
// (missing multiple properties)
module.exports = (onFn, config) => ({
  browsers: [{
    name: "browser name",
    family: "chromium"
  }]
});
