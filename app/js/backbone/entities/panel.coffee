@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Panel extends Entities.Model
    initialize: ->
      new Backbone.Chooser(@)

  class Entities.PanelsCollection extends Entities.Collection
    model: Entities.Panel

    setInitialStateByConfig: (config = {}) ->
      ## choose the models which are 'true'
      ## in the config
      @choose @filter (panel) ->
        config[panel.get("name")]

    initialize: ->
      new Backbone.MultiChooser(@)

  API =
    getPanels: (config) ->
      new Entities.PanelsCollection [
        {name: "DOM",  color: "#1C7EBB" }
        {name: "XHR",  color: "#FFB61C" }
        {name: "LOG",  color: "#999" }
      ]

  App.reqres.setHandler "panel:entities", (config = {}) ->
    API.getPanels config