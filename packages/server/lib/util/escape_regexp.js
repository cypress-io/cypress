/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const reSymbols = /[-\/\\^$*+?.()|[\]{}]/g;

module.exports = str => str.replace(reSymbols, '\\$&');