@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    start: ->
      ## instantiate Eclectus
      window.Ecl = new Eclectus

      ## set global mocha with our custom reporter
      window.mocha = new Mocha reporter: Eclectus.Reporter

      ## start running the tests
      mocha.run()

    stop: ->
      ## delete the globals to cleanup memory
      delete window.Ecl
      delete window.mocha

  App.vent.on "test:opened", ->
    API.start()

  App.vent.on "test:closed", ->
    API.stop()