do ($Cypress, $) ->
  remoteJQueryisNotSameAsGlobal = (remoteJQuery) ->
    remoteJQuery and (remoteJQuery isnt $)

  $Cypress.Cy.extend
    getRemotejQueryInstance: (subject) ->
      remoteJQuery = @_getRemoteJQuery()
      if $Cypress.Utils.hasElement(subject) and remoteJQueryisNotSameAsGlobal(remoteJQuery)
        remoteSubject = remoteJQuery(subject)
        $Cypress.Utils.setCypressNamespace(remoteSubject, subject)

        return remoteSubject

    _getRemoteJQuery: ->
      if opt = @Cypress.option("jQuery")
        return opt
      else
        @private("window").$