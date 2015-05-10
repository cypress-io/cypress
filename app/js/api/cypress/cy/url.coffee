do ($Cypress, _) ->

  $Cypress.Cy.extend
    urlChanged: ->
      ## figure out the remote url
      ## and fire the url:changed event

      url = @sync.url({log: false})
      @Cypress.trigger "url:changed", url