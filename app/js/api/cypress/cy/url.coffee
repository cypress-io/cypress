do ($Cypress, _) ->

  $Cypress.Cy.extend
    urlChanged: (url) ->
      ## allow the url to be explictly passed here
      url ?= @sync.url({log: false})

      ## about:blank returns "" and we dont
      ## want to trigger the url:changed
      return if _.isEmpty(url)

      @Cypress.trigger "url:changed", url

    pageLoading: (bool = true) ->
      @Cypress.trigger "page:loading", bool