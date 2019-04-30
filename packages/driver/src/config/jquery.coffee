$ = require("jquery")
_ = require('lodash')
require("jquery.scrollto")

$dom = require("../dom")

## force jquery to have the same visible
## and hidden logic as cypress

## this prevents `is` from calling into the native .matches method
## which would prevent our `focus` code from ever being called during
## is(:focus).
## see https://github.com/jquery/sizzle/wiki#sizzlematchesselector-domelement-element-string-selector-

## this is to help to interpretor make optimizations around try/catch
tryCatchFinally = ({tryFn, catchFn, finallyFn}) ->
  try
    tryFn()
  catch e
    catchFn(e)
  finally
    finallyFn()

matchesSelector = $.find.matchesSelector
$.find.matchesSelector = (elem, expr) ->
  isUsingFocus = _.includes(expr, ':focus')
  if isUsingFocus
    supportMatchesSelector = $.find.support.matchesSelector
    $.find.support.matchesSelector = false

  args = arguments
  _this = @

  return tryCatchFinally({
    tryFn: ->
      matchesSelector.apply(_this, args)
    catchFn: (e) ->
      throw e
    finallyFn: ->
      if isUsingFocus
        $.find.support.matchesSelector = supportMatchesSelector
  })


## see difference between 'filters' and 'pseudos'
## https://api.jquery.com/filter/ and https://api.jquery.com/category/selectors/

$.expr.pseudos.focus = $dom.isFocused
$.expr.filters.focus = $dom.isFocused
$.expr.pseudos.focused = $dom.isFocused
$.expr.filters.visible = $dom.isVisible
$.expr.filters.hidden = $dom.isHidden

$.expr.cacheLength = 1

$.ajaxSetup({
  cache: false
})
