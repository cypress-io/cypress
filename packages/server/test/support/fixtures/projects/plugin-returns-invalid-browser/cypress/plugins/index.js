// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// returns invalid config with a browser that is invalid
// (missing multiple properties)
module.exports = (onFn, config) => {
  return {
    browsers: [{
      name: 'browser name',
      family: 'chromium',
    }],
  }
}
