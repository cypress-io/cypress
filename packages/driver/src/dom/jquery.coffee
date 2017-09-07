$ = require("jquery")
_ = require("lodash")

wrapInjQuery = (obj) ->
  if isJquery(obj) then obj else $(obj)

isJquery = (obj) ->
  ## does it have the jquery property and is the
  ## constructor a function?
  !!(obj and obj.jquery and _.isFunction(obj.constructor))

## doing a little jiggle wiggle here
## to avoid circular dependencies
module.exports = {
  wrapInjQuery

  isJquery
}
