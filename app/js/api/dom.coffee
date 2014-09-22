## TODO need to handle scoping inner commands when the outer command fails
## it doesnt make sense to fail the first .find and then fail all
## subsequent finds.  should probably display that these have been skipped
## or just dont display them at all

## attach to Eclectus global
Eclectus.Dom = do ($, _, Eclectus) ->

  jQueryMethods =
    ["attr", "class", "css", "data", "have", "html", "id", "is", "prop", "text", "val"]

  traversalMethods =
    ["children", "eq", "first", "last", "next", "parent", "parents", "prev", "siblings"]

  jQueryTriggers =
    []

  ## create a reusable jquery selector object for our iframes
  ## which utilitizes our parent jquery object with the iframe
  ## context.  this means our consumers dont have to have jquery
  ## included in their project, and any modifications they make
  ## to jquery will not affect our own internal use of it
  class Dom extends Eclectus.Command
    config:
      type: "dom"

    initialize: ->
      @canBeParent = true

    wrap: (obj) ->
      return new Error "Ecl.wrap must be passed a jQuery instance" if not obj instanceof $

      @$el      = obj
      @length   = obj.length
      @selector = obj.selector or obj.prop("nodeName").toLowerCase()

      @checkForDomErrors()

      @emit
        selector: @selector
        method: "wrap"

    ## if find is called and we already have a selector
    ## it means we're chaining and we need to set prevObject
    ## just like jQuery
    find: (selector) ->
      ## if we already have an $el property it means we're chaining
      ## the find method and need to clone this and return a new dom object
      ## we store a _$el property because this is always the object
      ## we operate on since its our jQuery version and we can control
      ## methods and collisions + plugins
      ## we expose the .$el property which will use the contentWindow's jQuery
      ## version so users can continue to utilize their own 3rd party plugins
      ## they've extended jQuery with
      if @$el
        dom            = @clone()
        dom.prevObject = @
        dom.$el        = @$el.find(selector)
        dom._$el       = dom.$el
      else
        dom       = @
        dom.$el   = @$(selector, @contentWindow.jQuery)
        dom._$el  = @$(selector)

      dom.checkForDomErrors()

      dom.length   = dom.$el.length
      dom.selector = selector

      dom.emit
        selector: dom.selector
        method:   "find"

      return dom

    within: (selector) ->
      if @$el
        dom             = @clone()
        dom.prevObject  = @
        dom.$el         = @$el.find(selector)
        dom._$el        = dom.$el
      else
        dom     = @
        dom.$el = @$(selector, @contentWindow.jQuery)
        dom._$el  = @$(selector)

      dom.checkForDomErrors()

      dom.length   = dom.$el.length
      dom.selector = selector

      ## might want to strip out the previous selector here
      ## since we may not want to display that in our command view
      ## so instead of WITHIN #foo WITHIN #foo #bar WITHIN #foo #bar #baz
      ## we'd have WITHIN #foo WITHIN #bar WITHIN #baz
      dom.emit
        selector: dom.selector
        method:   "within"

      return dom

    hover: ->

    type: (sequence, options = {}) ->
      #@pauseRunnable() if sequence is "walk the dog{enter}" and @runnable.cid is "1lc"

      dom             = @clone()

      _.extend options,
        sequence: sequence
        # eventProps:
          # jQueryTrigger: true
          # simulatedEvent: true
        # triggerKeyEvents: false

      # @$el.val sequence
      if @elExistsInDocument()
        @_$el.simulate "key-sequence", options #if sequence is "{enter}"
      else
        dom.error = "not found"

      dom.prevObject  = @
      dom.$el         = @$el
      dom._$el        = @_$el
      dom.length      = @$el.length
      dom.selector    = @selector
      dom.canBeParent = false ## do not allow parent/child chaining off of this action

      dom.emit
        method:   "type"
        sequence: sequence

      return dom

    click: ->
      dom             = @clone()

      if @elExistsInDocument()
        @_$el.simulate "click"
      else
        dom.error = "not found"

      dom.prevObject  = @
      dom.$el         = @$el
      dom._$el        = @_$el
      dom.length      = @$el.length
      dom.selector    = @selector
      dom.canBeParent = false ## do not allow parent/child chaining off of this action

      dom.emit
        method:   "click"

      return dom

    submit: ->
      submit = new Event("submit")

      throw new Error("Cannot call method: #{method} without an existing DOM element.  Did you forget to call 'find' or 'within'?") if not @$el

      dom             = @clone()

      # if(document.createEvent) {
      #         var event = document.createEvent('Event');
      #         event.initEvent(eventName, true, true);
      #         document.dispatchEvent(event);
      #     } else {
      #         document.documentElement[eventName]++;
      #     }

      if @elExistsInDocument()
        @_$el.each (index, el) ->
          el.dispatchEvent(submit)
      else
        dom.error = "not found"

      dom.prevObject  = @
      dom.$el         = @$el
      dom._$el        = @_$el
      dom.length      = dom.$el.length
      dom.selector    = arguments[0]

      dom.emit
        selector: dom.selector
        method:   "submit"

    ## should not talk directly to the runnable here
    ## need to go through the runner to do this?
    pauseRunnable: ->
      @runnable.async = true
      @runnable.sync  = false
      ## unless i wrap this in a defer it wont
      ## actually clear the timeout
      ## gonna have to dig into mocha something is
      ## probably resetting the timeout
      _.defer =>
        @runnable.clearTimeout()

    checkForDomErrors: ->
      error = switch
        ## ...will add more conditions here...
        when @$el.length is 0 or !@elExistsInDocument() then "not found"

      @error = error if error
      @

    ## sugar for chai jquery to check element existance
    exist: ->
      @$el.length > 0

  ## apply each of native jQuery methods
  ## directly to our dom instance
  _.each jQueryMethods, (method) ->
    Dom.prototype[method] = ->
      @_$el[method].apply(@_$el, arguments)
      return @

  ## both within + find + eq are all traversal methods
  ## double check that find + within are
  ## but eq, children, siblings, parent, parents, etc
  ## are all traversal methods that can simply be looped over
  ## and dynamically generated
  _.each traversalMethods, (method) ->
    Dom.prototype[method] = ->
      throw new Error("Cannot call method: #{method} without an existing DOM element.  Did you forget to call 'find' or 'within'?") if not @$el

      ## there wont be a selector with traversal methods
      ## instead there will just be arguments
      dom             = @clone()
      dom.prevObject  = @
      dom.$el         = @$el[method].apply(@$el, arguments)
      dom._$el         = @_$el[method].apply(@_$el, arguments)
      dom.length      = dom.$el.length
      dom.selector    = arguments[0]

      # dom.replaceAll @$el.find("iframe").contents().find("body")

      ## TODO refactor selectors / el highlighting
      ## how to persist the document DOM?

      ## should i just always send the arguments instead
      ## of the selector? why ever use the selector?

      dom.emit
        selector: dom.selector
        method:   method

      ## after we emit this event, changed the cloned instanceid?
      ## that way when we chain methods

      ## think about how to improve chaining instances together
      ## perhaps always return a new instance and prior to cloning
      ## we should reference the original parent

      ## jQuery always returns a new object instance when you traverse

      return dom

  _.each jQueryTriggers, (method) ->
    Dom.prototype[method] = ->
      throw new Error("Cannot call method: #{method} without an existing DOM element.  Did you forget to call 'find' or 'within'?") if not @$el

      dom             = @clone()

      if @elExistsInDocument()
        @_$el[method].call(@$el)
      else
        dom.error = "not found"

      dom.prevObject  = @
      dom.$el         = @$el
      dom._$el        = @_$el
      dom.length      = dom.$el.length
      dom.selector    = arguments[0]

      dom.emit
        selector: dom.selector
        method:   method

  return Dom