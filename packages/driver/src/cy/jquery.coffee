$ = require("jquery")

$utils = require("../cypress/utils")

remoteJQueryisNotSameAsGlobal = (remoteJQuery) ->
  remoteJQuery and (remoteJQuery isnt $)

create = (state) ->
  jquery = ->
    state("jQuery") or state("window").$

  return {
    getRemotejQueryInstance: (subject) ->
      remoteJQuery = jquery()

      if $utils.hasElement(subject) and remoteJQueryisNotSameAsGlobal(remoteJQuery)
        remoteSubject = remoteJQuery(subject)

        $utils.setCypressNamespace(remoteSubject, subject)

        return remoteSubject
  }

module.exports = {
  create
}
