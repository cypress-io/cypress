@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  _.extend App,

    clearAllCookiesBeforeUnload: ->
      ## when our window triggers beforeunload
      ## we know we've change the URL and we need
      ## to clear our cookies!
      $(window).on "beforeunload", =>
        @clearAllCookies()

        return undefined

    ## clear all the cypress specific cookies
    ## whenever our app starts
    ## and additional when we stop running our tests
    clearAllCookies: ->
      _.each Cookies.get(), (value, key) ->
        Cookies.remove(key, {path: "/"})