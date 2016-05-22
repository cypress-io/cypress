@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  do ($Cypress) ->

    _.extend App,

      clearAllCookiesBeforeUnload: ->
        ## when we actually unload then
        ## nuke all of the cookies again
        ## so we clear out unload
        $(window).on "unload", =>
          @clearAllCookies()

        ## when our window triggers beforeunload
        ## we know we've change the URL and we need
        ## to clear our cookies
        ## additionally we set unload to true so
        ## that Cypress knows not to set any more
        ## cookies
        $(window).on "beforeunload", =>
          @clearAllCookies()
          @setUnload()

          return undefined

      ## clear all the cypress specific cookies
      ## whenever our app starts
      ## and additional when we stop running our tests
      clearAllCookies: ->
        $Cypress.Cookies.clearCypressCookies()

      setUnload: ->
        $Cypress.Cookies.setCy("unload", true)
