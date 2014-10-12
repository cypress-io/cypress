## attach to Eclectus global
## this is our base command class the others will inherit from
Eclectus.Command = do ($, _) ->
  ## the attr which we use to find the dom element
  ## when we revert the DOM
  class Command
    highlightAttr: "data-eclectus-el"

    constructor: (@$remoteIframe, @channel, @runnable, @hook) ->
      # @document = @$remoteIframe[0].contentWindow.document

      ## this is the unique identifer of all instantiated
      ## commands.  so as we chain off of this id
      ## we can reference back up to the parent id
      ## we chained off of.
      @id = @getId()

      ## call init passing up our arguments
      @initialize(arguments...) if @initialize

    ## instatiate a new jquery instance using
    ## the window's or our own if its undefined
    ## this should probably be configurable for
    ## projects which dont have jQuery attached as
    ## a global (like requireJS)
    $: (selector, jQuery = $) ->
      new jQuery.fn.init(selector, @getDocument())

    getDocument: ->
      contentWindow = @$remoteIframe[0].contentWindow
      throw new Error("The Remote Iframe has not finished loading, you cannot use finders methods yet!") if not contentWindow.document
      contentWindow.document

    getId: ->
      _.uniqueId("instance")

    getConfig: ->
      throw new Error("config must be set") if not @config

      config = _(@).result "config"

      throw new Error("config.type must be set") if not config.type

      _(config).defaults
        snapshot: true

    getSnapshot: ->
      ## create a unique selector for this el
      @$el.attr(@highlightAttr, true) if @$el

      ## clone the body and strip out any script tags
      body = @$("body").clone()
      body.find("script").remove()

      ## here we need to figure out if we're in a remote manual environment
      ## if so we need to stringify the DOM:
      ## 1. grab all inputs / textareas / options and set their value on the element
      ## 2. convert DOM to string: body.prop("outerHTML")
      ## 3. send this string via websocket to our server
      ## 4. server rebroadcasts this to our client and its stored as a property

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
        snapshot: config.snapshot
        type: config.type

      ## convert to a string always in case our arg was an object
      obj.selector = obj.selector.toString()

      obj.el = @$el if @$el

      obj.error = @error if @error

      ## store this as a private property so its
      ## test accessible
      @_parent = obj.parent

      ## add the snapshot to the object
      ## if its true
      obj.snapshot = @getSnapshot() if obj.snapshot

      @channel.trigger(obj.type, @runnable, obj, @hook) if @channel

    ## walk up the 'prevObject' chain until we have an object
    ## which can be a parent
    getParentId: (parent) ->
      return if not parent

      return parent.id if parent.canBeParent
      @getParentId(parent.prevObject)

    ## check to make sure our real dom element
    ## still exists in our current document
    elExistsInDocument: ->
      $.contains @getDocument(), @$el[0]

    clone: ->
      new @constructor(@$remoteIframe, @channel, @runnable, @hook)

    isCommand: -> true

  return Command