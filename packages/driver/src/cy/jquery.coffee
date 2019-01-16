$ = require("jquery")

$dom = require("../dom")
$utils = require("../cypress/utils")

remoteJQueryisNotSameAsGlobal = (remoteJQuery) ->
  remoteJQuery and (remoteJQuery isnt $)

create = (state) ->
  jquery = ->
    state("jQuery") or state("window").$

  return {
    getRemotejQueryInstance: (subject) ->
      remoteJQuery = jquery()

      ## we make assumptions that you cannot have
      ## an array of mixed types, so we only look at
      ## the first item (if there's an array)
      firstSubject = $utils.unwrapFirst(subject)

      if $dom.isElement(firstSubject) and remoteJQueryisNotSameAsGlobal(remoteJQuery)
        remoteSubject = remoteJQuery(subject)

        return remoteSubject
  }

module.exports = {
  create
}
