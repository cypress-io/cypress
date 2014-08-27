@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  ## a container holds a flat reference to all of the runnables
  ## its used to manage and maintain the state of the current run
  ## and the previous run

  ## this allows us to know when the client has changed test titles
  ## removed older ones, or moved around others

  ## a model cannot be in two different collections at once else its
  ## reference to the parent collection will collide

  ## for this reason we cannot use a backbone collection

  class Entities.Container
    constructor: ->
      @previousRunnables = []
      @previousIds = {}

      @currentRunnables = []
      @currentIds = {}

    getPreviousById: (id) ->
      @previousIds[id]

    get: (id) ->
      @currentIds[id]

    add: (runnable, type, root) ->
      ## either locate the runnable (if it exists) by the previous runnable
      ## ids or create a real runnable model from the original framework runnable
      ## this ensures we are working with the same model and not generating a new one
      model = @getPreviousById(runnable.cid) or App.request("runnable:entity", type)

      ## push the model into our current runnables array
      @currentRunnables.push model

      ## this sets its attributes from the runnable - so if its new it gets its
      ## normal attributes, but if its existing it has a chance to have them updated
      ## either its title, parent id, etc
      model.setAttrsFromRunnable runnable, @getIndex(model)

      ## figure out where this model should go?
      ## if we have its existing parent we insert it there
      ## else it goes on the root
      @insertIntoExistingParentOrRoot model, root

      ## and set its id for fast lookup
      @currentIds[model.id] = model

      return model

    getIndex: (model) ->
      _.indexOf @currentRunnables, model

    ## backup a reference to the previous runnables
    reset: ->
      @previousRunnables = @currentRunnables
      @previousIds = @currentIds
      @currentRunnables = []
      @currentIds = {}

    removeOldModels: ->
      ## grab a list of current runnable ids
      ids = @pluck("id")

      _(@previousRunnables).each (runnable) ->
        ## remove it if its id isnt in our current runnables
        runnable.remove() if runnable.id not in ids

    insertIntoExistingParentOrRoot: (model, root) ->
      ## if our parent exists add the runnable model to it
      if parent = @get(model.get("parentId"))
        parent.addRunnable model
      else
        ## bail if our parent isnt the root
        ## we have to check against this because
        ## sometimes old tests arent stopped fast
        ## enough and we dont want to add them again
        return if not model.get("parentRoot")

        ## it needs to go on the root since its parent
        ## hasnt been added yet
        root.addRunnable model

  ## mixin underscore methods
  _.each ["each", "pluck"], (method) ->
    Entities.Container.prototype[method] = (args...) ->
      args.unshift(@currentRunnables)
      _[method].apply(_, args)

  App.reqres.setHandler "runnable:container:entity", ->
    new Entities.Container