$ = require("jquery")
require("jquery.scrollto")

$dom = require("../dom")

## force jquery to have the same visible
## and hidden logic as cypress
$.expr.filters.focus = $dom.isFocused
$.expr.filters.focused = $dom.isFocused
$.expr.filters.visible = $dom.isVisible
$.expr.filters.hidden = $dom.isHidden

$.expr.cacheLength = 1

$.ajaxSetup({
  cache: false
})
