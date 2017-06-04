$ = require("jquery")
require("jquery.scrollto")

dom = require("../cypress/dom")

## force jquery to have the same visible
## and hidden logic as cypress
$.expr.filters.visible = dom.isVisible
$.expr.filters.hidden = dom.isHidden

$.expr.cacheLength = 1

$.ajaxSetup({
  cache: false
})
