do ($Cypress, _) ->

  $Cypress.Cy.extend
    urlChanged: (url, options = {}) ->
      ## allow the url to be explictly passed here
      url ?= @sync.url({log: false})

      ## about:blank returns "" and we dont
      ## want to trigger the url:changed
      return if _.isEmpty(url)

      urls = @prop("urls") ? []

      previousUrl = _.last(urls)

      urls.push(url)

      @prop("urls", urls)

      _.defaults options,
        log: true
        by: null
        args: null

      ## ensure our new url doesnt match whatever
      ## the previous was. this prevents logging
      ## additionally when the url didnt actually change
      if options.log and (url isnt previousUrl)
        Cypress.command
          name: "new url"
          message: url
          event: true
          type: "parent"
          end: true
          snapshot: true
          onConsole: ->
            obj = {
              Event: "url updated"
              "New Url": url
            }

            if options.by
              obj["Url Updated By"] = options.by

            obj.args = options.args

            return obj

      @Cypress.trigger "url:changed", url

    pageLoading: (bool = true) ->
      @Cypress.trigger "page:loading", bool