const $ = require('jquery')
const _ = require('lodash')

// wrap the object in jquery
const wrap = (obj) => {
  return $(obj)
}

const query = (selector, context) => {
  return new $.fn.init(selector, context)
}

// pull out the raw elements if this is wrapped
const unwrap = function (obj) {
  if (isJquery(obj)) {
    // return an array of elements
    return obj.toArray()
  }

  return obj
}

const isJquery = (obj) => {
  // does it have the jquery property and does this
  // instance have a constructor with a jquery property
  // on it's prototype?
  return !!(obj && obj.jquery && _.get(obj, 'constructor.prototype.jquery'))
}

// doing a little jiggle wiggle here
// to avoid circular dependencies
module.exports = {
  wrap,

  query,

  unwrap,

  isJquery,
}
