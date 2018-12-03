$ = require("jquery")
_ = require("lodash")

## wrap the object in jquery
wrap = (obj) ->
  $(obj)

query = (selector, context) ->
  new $.fn.init(selector, context)

## pull out the raw elements if this is wrapped
unwrap = (obj) ->
  if isJquery(obj)
    ## return an array of elements
    obj.toArray()
  else
    obj

isJquery = (obj) ->
  ## does it have the jquery property and is the
  ## constructor a function?
  try
    hasJqueryProperty = "jquery" in obj or obj?.jquery

  !!(hasJqueryProperty and _.isFunction(obj.constructor))

## doing a little jiggle wiggle here
## to avoid circular dependencies
module.exports = {
  wrap

  query

  unwrap

  isJquery
}
