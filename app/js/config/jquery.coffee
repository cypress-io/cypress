do ($, _) ->

  $.expr.cacheLength = 1

  $.ajaxSetup
    cache: false