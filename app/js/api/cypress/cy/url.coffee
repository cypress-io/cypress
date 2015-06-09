do ($Cypress, _) ->

  $Cypress.Cy.extend
    urlChanged: (url, options = {}) ->
      ## allow the url to be explictly passed here
      url ?= @sync.url({log: false})

      ## about:blank returns "" and we dont
      ## want to trigger the url:changed
      return if _.isEmpty(url)

      _.defaults options,
        log: true
        attr: null
        args: null

      if options.log
        Cypress.command
          name: "url upd"
          message: url
          event: true
          type: "parent"
          end: true
          snapshot: true
          onConsole: ->
            obj = {
              Command: null
              Event: "url updated"
              "New Url": url
            }

            if options.attr
              obj["Url Updated By"] = options.attr

            obj.args = options.args

            return obj

      @Cypress.trigger "url:changed", url

    pageLoading: (bool = true) ->
      @Cypress.trigger "page:loading", bool