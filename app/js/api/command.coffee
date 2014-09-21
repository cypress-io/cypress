
## attach to Eclectus global
## this is our base command class the others will inherit from
Eclectus.Command = do ($, _) ->
  ## the attr which we use to find the dom element
  ## when we revert the DOM
  class Command
    highlightAttr: "data-eclectus-el"

    constructor: (@document, @channel, @runnable) ->
      ## this is the unique identifer of all instantiated
      ## commands.  so as we chain off of this id
      ## we can reference back up to the parent id
      ## we chained off of.
      @id = @getId()

      ## call init passing up our arguments
      @initialize(arguments...) if @initialize

    $: (selector) ->
      new $.fn.init(selector, @document)

    getId: ->
      _.uniqueId("instance")

    getConfig: ->
      throw new Error("config must be set") if not @config

      config = _(@).result "config"

      throw new Error("config.type must be set") if not config.type

      _(config).defaults
        dom: true

    getDom: ->
      ## create a unique selector for this el
      @$el.attr(@highlightAttr, true) if @$el

      ## clone the body and strip out any script tags
      body = @$("body").clone(true, true)
      body.find("script").remove()

      ## now remove it after we clone
      @$el.removeAttr(@highlightAttr) if @$el

      return body

    emit: (obj) ->
      config = @getConfig()

      _.defaults obj,
        parent: @getParentId(@prevObject)
        length: @length
        highlightAttr: @highlightAttr
        id: @id
        selector: ""
        canBeParent: @canBeParent
        dom: config.dom
        type: config.type

      ## convert to a string always in case our arg was an object
      obj.selector = obj.selector.toString()

      obj.el = @$el if @$el

      obj.error = @error if @error

      ## store this as a private property so its
      ## test accessible
      @_parent = obj.parent

      ## add the dom to the object
      ## if its true
      obj.dom = @getDom() if obj.dom

      @channel.trigger obj.type, @runnable, obj if @channel

    ## walk up the 'prevObject' chain until we have an object
    ## which can be a parent
    getParentId: (parent) ->
      return if not parent

      return parent.id if parent.canBeParent
      @getParentId(parent.prevObject)

    ## check to make sure our real dom element
    ## still exists in our current document
    elExistsInDocument: ->
      $.contains @document, @$el[0]

    clone: ->
      new @constructor(@document, @channel, @runnable)

    isCommand: -> true

  return Command