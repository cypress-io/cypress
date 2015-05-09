@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  _.extend App,

    ## clear all the cypress specific cookies
    ## whenever our app starts
    ## and additional when we stop running our tests
    clearCookies: (namespace) ->
      _.each Cookies.get(), (value, key) ->
        ## our cookies key starts with the cypress
        ## namespace:
        ## DEFAULT: __cypress
        if _(key).startsWith(namespace)
          Cookies.remove(key, {path: "/"})