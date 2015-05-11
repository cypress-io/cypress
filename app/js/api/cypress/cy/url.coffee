do ($Cypress, _) ->

  $Cypress.Cy.extend
    urlChanged: (url) ->
      ## allow the url to be explictly passed here
      url ?= @sync.url({log: false})
      @Cypress.trigger "url:changed", url