$ = require("jquery")
require("jquery.scrollto")

$dom = require("../dom")

## force jquery to have the same visible
## and hidden logic as cypress

## see difference between 'filters' and 'pseudos'
## https://api.jquery.com/filter/ and https://api.jquery.com/category/selectors/

# debugger


$.expr.filters.focus = $dom.isFocused
$.expr.pseudos.focus = $dom.isFocused
$.expr.pseudos.focused = $dom.isFocused
$.expr.filters.visible = $dom.isVisible
# $.expr.pseudos.visible = $dom.isVisible
$.expr.filters.hidden = $dom.isHidden
# $.expr.pseudos.hidden = $dom.isHidden

$.expr.cacheLength = 1

$.ajaxSetup({
  cache: false
})
