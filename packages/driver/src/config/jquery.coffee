$ = require("jquery")
require("jquery.scrollto")

$dom = require("../dom")

## force jquery to have the same visible
## and hidden logic as cypress

## this prevents `is` from calling into the native .matches method
## which would prevent our `focus` code from ever being called during
## is(:focus).
## see https://github.com/jquery/sizzle/wiki#sizzlematchesselector-domelement-element-string-selector-

oldMatches = $.find.matchesSelector
$.find.matchesSelector = (elem, expr) ->
  forceCustomSelector = expr && expr.indexOf && (expr.indexOf(':focus') isnt -1)
  if forceCustomSelector
    backup = $.find.support.matchesSelector
    $.find.support.matchesSelector = false
  ret = oldMatches.apply(@, arguments)
  if forceCustomSelector
    $.find.support.matchesSelector = backup
  return ret


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
