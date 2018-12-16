/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = require("jquery");
const _ = require("lodash");

//# wrap the object in jquery
const wrap = obj => $(obj);

const query = (selector, context) => new $.fn.init(selector, context);

//# pull out the raw elements if this is wrapped
const unwrap = function(obj) {
  if (isJquery(obj)) {
    //# return an array of elements
    return obj.toArray();
  } else {
    return obj;
  }
};

var isJquery = obj =>
  //# does it have the jquery property and is the
  //# constructor a function?
  !!(obj && obj.jquery && _.isFunction(obj.constructor))
;

//# doing a little jiggle wiggle here
//# to avoid circular dependencies
module.exports = {
  wrap,

  query,

  unwrap,

  isJquery
};
