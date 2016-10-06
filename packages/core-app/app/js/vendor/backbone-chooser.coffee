do (Backbone, _) ->

  excludeChosenFromToJSON = (model) ->
    toJSON = _.wrap model.toJSON, (orig, args...) ->
      ## first arg is options or empty obj
      options = args[0] ? {}

      obj = orig.apply(@, args)

      ## when backbone hands off the models attributes to the server
      ## it pushes emulateJSON into the options prior to calling
      ## toJSON.  So we can work off of the existence of that property
      ## to know we're saving and going over the wire
      obj = _(obj).omit("chosen") if _(options).has "emulateJSON"
      obj

    model.toJSON = toJSON

  class Backbone.Chooser
    constructor: (model) ->
      @model = model
      @model._chooser = @

      @model[method] = _.bind(@[method], @) for method in @_publicMethods()

      @chosen = false
      @model.set chosen: false

      excludeChosenFromToJSON(model)

    _publicMethods: -> ["choose", "unchoose", "toggleChoose", "isChosen"]

    isChosen: ->
      !!@chosen

    choose: (options = {}) ->
      return if @isChosen()

      @chosen = true
      @model.onChoose?()
      @model.set chosen: true, options
      @model.trigger "model:chosen", @model, options unless options.silent is true
      @model.collection?.choose?(@model, options)

    unchoose: (options = {}) ->
      return if !@isChosen()

      @chosen = false
      @model.onUnchoose?()
      @model.set chosen: false, options
      @model.trigger "model:unchosen", @model, options unless options.silent is true
      @model.collection?.unchoose?(@model, options)

    toggleChoose: ->
      if @isChosen() then @unchoose() else @choose()

  class BaseChooser
    constructor: (collection) ->
      @collection = collection

      @collection._chooser = @
      @collection._chooser.chosen = {}

      @collection[method] = _.bind(@[method], @) for method in @_publicMethods()

    _publicMethods: -> ["choose", "unchoose", "getChosen", "getFirstChosen", "chooseById"]

    getChosen: ->
      _.toArray @chosen

    getFirstChosen: ->
      @getChosen()[0]

    modelInChosen: (model) ->
      model.cid in _.keys @chosen

    addModel: (model, options = {}) ->
      @chosen[model.cid] = model
      model.choose?(options)

    removeModels: (model = false) ->
      for model in _.flatten [model or @getChosen()]
        delete @chosen[model.cid]
        model.unchoose?()

    triggerEvent: (event = false, options = {}) ->
      _.defaults options, silent: false

      return if options.silent is true

      event or= @_getEvent()
      @collection.trigger event, @_eventArg()

    chooseById: (id, options = {}) ->
      model = @collection.get(id)
      @choose model, options if model

  class Backbone.SingleChooser extends BaseChooser
    ## return only the first model as the event argument
    _eventArg: -> @getFirstChosen()

    choose: (model, options) ->
      ## return if the model is already chosen
      return if @modelInChosen(model)

      @removeModels()

      ## add the model to the chosen array
      @addModel(model)

      ## fire a chosen event
      @triggerEvent "collection:chose:one", options

    unchoose: (model, options) ->
      return if !@modelInChosen(model)

      @removeModels(model)

      ## fire a unchose event
      @triggerEvent "collection:unchose:one", options

  class Backbone.MultiChooser extends BaseChooser
    constructor: ->
      super
      @collection[method] = _.bind(@[method], @) for method in ["chooseAll", "chooseNone", "chooseByIds"]

    ## return all of the chosen models as the event argument
    _eventArg: -> @getChosen()

    choose: (args...) ->
      options = if _.chain(args).flatten().last().value() not instanceof Backbone.Model then args.pop() else {}

      eventShouldTrigger = false

      for model in _([args]).flatten()
        ## break if the model is already chosen
        break if @modelInChosen(model)

        ## know to trigger a one time event
        eventShouldTrigger or= true

        ## add the model to the chosen array
        @addModel(model, options)

      ## fire event
      @triggerEvent(false, options) if eventShouldTrigger

    unchoose: (args...) ->
      options = if _.chain(args).flatten().last().value() not instanceof Backbone.Model then args.pop() else {}

      eventShouldTrigger = false

      for model in _([args]).flatten()
        ## break if the model is already chosen
        break if !@modelInChosen(model)

        ## know to trigger a one time event
        eventShouldTrigger or= true

        ## add the model to the chosen array
        @removeModels(model, options)

      ## fire event
      @triggerEvent(false, options) if eventShouldTrigger

    chooseAll: (options = {}) ->
      return if not _.difference(@collection.models, @getChosen()).length

      @addModel(model) for model in @collection.models

      @triggerEvent(false, options)

    chooseNone: (options = {}) ->
      return if @getChosen().length is 0

      @removeModels()

      @triggerEvent(false, options)

    ## chooses models by an array of ids
    ## passing chooseNone as options will
    ## first clear the current chosen
    chooseByIds: (ids = [], options = {}) ->
      _.defaults options, chooseNone: true

      @chooseNone options if options.chooseNone

      for id in _([ids]).flatten()
        @chooseById id, options

    _getEvent: ->
      if @collection.length is @getChosen().length
        return "collection:chose:all"

      if @getChosen().length is 0
        return "collection:chose:none"

      return "collection:chose:some"
