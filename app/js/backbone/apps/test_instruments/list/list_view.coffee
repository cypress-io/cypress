@App.module "TestInstruments.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Instruments extends App.Views.ItemView
    template: "test_instruments/list/instruments"

    className: "instruments-container"