$ = require("jquery")

utils = require("../cypress/utils")

remoteJQueryisNotSameAsGlobal = (remoteJQuery) ->
  remoteJQuery and (remoteJQuery isnt $)

module.exports = ($Cy) ->
  $Cy.extend
    _getRemotejQueryInstance: (subject) ->
      remoteJQuery = @_getRemoteJQuery()
      if utils.hasElement(subject) and remoteJQueryisNotSameAsGlobal(remoteJQuery)
        remoteSubject = remoteJQuery(subject)
        utils.setCypressNamespace(remoteSubject, subject)

        return remoteSubject

    _getRemoteJQuery: ->
      if opt = @Cypress.option("jQuery")
        return opt
      else
        @privateState("window").$
