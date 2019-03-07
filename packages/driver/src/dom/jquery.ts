import $ from 'jquery'
import _ from 'lodash'

// wrap the object in jquery
const wrap = <T>(obj:T) => {
  return $(obj)
}

const query = (selector, context): JQuery<HTMLElement> => {
  // @ts-ignore
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
  // does it have the jquery property and is the
  // constructor a function?
  return !!(obj && obj.jquery && _.isFunction(obj.constructor))
}

// doing a little jiggle wiggle here
// to avoid circular dependencies
export {
  wrap,

  query,

  unwrap,

  isJquery,
}
