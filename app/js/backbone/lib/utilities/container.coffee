@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  ## this mimics the way real backbone collections work except this
  ## simply tracks our real test framework's runnables alongside
  ## our real runnable backbone models

  # API =
  #   getRunnableContainer: ->
  #     container = []

  #     ## mixin underscore methods to our container array
  #     _(["each", "find"]).each (method) ->
  #       container[method] = (args...) ->
  #         ## force our proxied underscore models to work
  #         ## off our internal models array and not our
  #         ## outer runnable one
  #         args.unshift @_models
  #         _[method].apply _, args

  #     ## keep track of the internal models
  #     container._models = []

  #     ## remove all of our models
  #     container.reset = ->
  #       ## nothing has a reference to this so its okay
  #       ## to just reset to a new empty array
  #       @_models = []

  #       ## remove our real models 1 by 1 since there are
  #       ## external references to us
  #       while @length
  #         @pop()

  #     ## add the runnables model to our internal array
  #     container.add = (runnable) ->
  #       @push runnable
  #       @_models.push runnable.model

  #     container.remove = (runnable) ->
  #       ## remove from our normal array
  #       index = _.indexOf @, runnable
  #       @splice(index, 1)

  #       ## remove from the internal model array
  #       modelIndex = _.indexOf @_models, runnable.model
  #       @_models.splice(modelIndex, 1)

  #     container.get = (id) ->
  #       @find (model) -> model.id is id

  #     container


  # App.reqres.setHandler "runnable:container", ->
    # new Container
