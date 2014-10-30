@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  _.extend App,

    ## if mochaPhantomJS is defined on our window
    ## we know we're in CI mode, else we'll assume
    ## we're in UI mode
    getCurrentEnvironment: ->
      if window.mochaPhantomJS then "ci" else "ui"