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

  ## create a reusable jquery selector object for our iframes
  ## which utilitizes our parent jquery object with the iframe
  ## context.  this means our consumers dont have to have jquery
  ## included in their project, and any modifications they make
  ## to jquery will not affect our own internal use of it
  class Dom extends Eclectus.Command
    config:
      type: "dom"

    ## if find is called and we already have a selector
    ## it means we're chaining and we need to set prevObject
    ## just like jQuery
    find: (selector) ->
      ## if we already have an $el property it means we're chaining
      ## the find method and need to clone this and return a new dom object
      if @$el
        dom         = @clone()
        dom.parent  = @
        dom.$el     = @$el.find(selector)
      else
        dom     = @
        dom.$el = @$(selector)

      dom.length   = dom.$el.length
      dom.selector = selector

      dom.emit
        selector: dom.selector
        method:   "find"

      return dom

    within: (selector, fn) ->
      if @$el
        dom         = @clone()
        dom.parent  = @
        dom.$el     = @$el.find(selector)
      else
        dom     = @
        dom.$el = @$(selector)

      dom.length   = dom.$el.length
      dom.selector = dom.$el.selector

      ## might want to strip out the previous selector here
      ## since we may not want to display that in our command view
      ## so instead of WITHIN #foo WITHIN #foo #bar WITHIN #foo #bar #baz
      ## we'd have WITHIN #foo WITHIN #bar WITHIN #baz
      dom.emit
        selector: dom.selector
        method:   "within"

      ## instead of patching all of these things here
      ## why wouldnt we just pass this instanceId around?
      ## that would probably work better with chaining
      ## call this scope? instead of patch?
      ## if obj instanceIdof Eclectus.Dom then just use that
      ## else instatiate a new one
      ## ----------------------------------------------
      ## re-patch eclectus with this previous el object
      dom.scope()

      fn.call(dom)

      ## then undo so commands after this are back to normal
      dom.unscope()

      return dom

    type: (sequence, options = {}) ->
      #@pauseRunnable() if sequence is "walk the dog{enter}" and @runnable.cid is "1lc"

      _.extend options,
        sequence: sequence
        # eventProps:
          # jQueryTrigger: true
          # simulatedEvent: true
        # triggerKeyEvents: false

      # @$el.val sequence
      @$el.simulate "key-sequence", options #if sequence is "{enter}"

      @emit
        # selector: @selector
        # el:       @$(@selector)
        method:   "type"
        sequence: sequence

      return @

    click: ->
      @selector = @$el.selector

      @$el.simulate "click"
      # @$el.click()

      @emit
        # el:       @$(@selector)
        method:   "click"

      return @

    ## should not talk directly to the runnable here
    ## need to go through the runner to do this?
    pauseRunnable: ->
      @runnable.async = true
      @runnable.sync = false
      ## unless i wrap this in a defer it wont
      ## actually clear the timeout
      ## gonna have to dig into mocha something is
      ## probably resetting the timeout
      _.defer =>
        @runnable.clearTimeout()

    ## sugar for chai jquery to check element existance
    exist: ->
      @$el.length > 0

  ## apply each of native jQuery methods
  ## directly to our dom instance
  _.each jQueryMethods, (method) ->
    Dom.prototype[method] = ->
      @$el[method].apply(@$el, arguments)

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
      dom           = @clone()
      dom.parent    = @
      dom.$el       = @$el[method].apply(@$el, arguments)
      dom.length    = dom.$el.length
      dom.selector  = arguments[0]

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

  return Dom