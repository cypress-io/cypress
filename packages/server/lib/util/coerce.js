/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _         = require("lodash");
const toBoolean = require("underscore.string/toBoolean");

module.exports = function(value) {
  switch (false) {
    //# convert to number
    case __guard__(_.toNumber(value), x => x.toString()) !== value:
      return _.toNumber(value);
    //# convert to boolean
    case __guard__(toBoolean(value), x1 => x1.toString()) !== value:
      return toBoolean(value);
    default:
      return value;
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}