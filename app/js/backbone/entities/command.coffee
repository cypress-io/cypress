@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  ## this is another good candidate for a mutator
  ## with stripping out the parent selector

  CYPRESS_ATTRS = "_cypress"

  class Entities.Command extends Entities.Model
    defaults: ->
      indent: 0
      pause: false
      revert: false
      number: 0

    mutators:
      selector: ->
        _.trim @stripParentSelector()

      ## display controls if there isnt an error
      ## and this isnt a clone
      shouldDisplayControls: ->
        not @isCloned()

      truncated: ->
        switch @get("type")
          when "xhr" and @response          then @xhr.responseTextText.length > 40
          when "assertion", "spy", "stub"   then @get("message")?.length > 100

      messageTruncated: ->
        return if not message = @get("message")
        _(message).truncate(100, " ")

    reset: ->
      @clear(silent: true)
      @clear(silent: true)
      _.each ["assert", "spy", "spyCall", "spyObj", "stub", "stubCall", "stubObj", "el", "server", "subject", "expected", "actual", "xhr", "snapshot", "requests", "responses", "response"], (attr) =>
        delete @[attr]

    initialize: ->
      new Backbone.Chooser(@)

    ## TODO: ADD TESTS FOR THIS METHOD
    displayName: ->
      @get("name").replace(/(\s+)/g, "-")

    increment: (num) ->
      @set "number", num

    is: (type) ->
      @get("type") is type

    ## call the associated cypress command callback
    ## pass along the args with the context of our
    ## private cypress attrs
    triggerCommandCallback: (name, args...) ->
      if _.isFunction(fn = @[CYPRESS_ATTRS][name])
        fn.apply(@[CYPRESS_ATTRS], args)

    highlight: (init) ->
      @set "highlight", init

    indent: (indent) ->
      indent = @parent.get("indent")
      @set "indent", indent + 5

    setParent: (parent) ->
      @parent = parent
      @set "hasParent", true
      @parent.set "isParent", true
      @

    hasParent: ->
      !!@get("hasParent")

    isParent: ->
      !!@get("isParent")

    isCloned: ->
      !!@get("isCloned")

    stripParentSelector: ->
      selector = @attributes.selector ? ""

      ## bail if we dont even have a parent
      return selector if not @hasParent()

      parent = @parent.attributes.selector ? ""

      ## replace only the first occurance of the parent selector
      selector.replace parent, ""

    setResponse: (response) ->
      @set "status", @xhr.status
      @set "response", _(@xhr.responseText).truncate(40, " ")
      @set "requestMethod", @xhr.method
      @set "url", @xhr.url
      @response = response

    getPrimaryObjects: ->
      objs = switch @get("type")
        # when "dom"        then @getDomObject()
        # when "assertion"  then @getAssertion()
        when "server"     then @getServer()
        when "xhr"        then @getXhrObject()
        when "spy"        then @getSpyObject()
        when "stub"       then @getStubObject()
        # when "visit"      then @getVisitObject()

      _([objs]).flatten(true)

    getSnapshot: ->
      @[CYPRESS_ATTRS]._snapshot

    getEl: ->
      @[CYPRESS_ATTRS].$el

    getConsoleDisplay: (fn) ->
      obj = @triggerCommandCallback("onConsole", @[CYPRESS_ATTRS])

      return if _.isEmpty(obj)

      obj = @formatForConsole(obj)

      _.each obj, (value, key) ->
        fn ["%c" + key, "font-weight: bold;", value] unless _.isBlank(value)

    formatForConsole: (obj) ->
      ## figure out the max key length
      maxKeyLength = @getMaxKeyLength(obj)

      ## format each key by right padding it
      ## with white space and appending a colon
      ## taking into account the lenth of what
      ## we're appending
      _.reduce obj, (memo, value, key) ->
        append = ": "
        key = _.chain(key + append).capitalize().rpad(maxKeyLength + append.length, " ").value()
        memo[key] = value
        memo
      , {}

    getMaxKeyLength: (obj) ->
      lengths = _.chain(obj).keys().map( (key) -> key.length ).value()
      Math.max.apply(Math, lengths)

    convertToArray: (obj) ->
      _.reduce obj, (memo, value, key) ->
        memo.push ["%c" + key, "font-weight: bold;", value] unless _.isBlank(value)
        memo
      , []

    # getDomObject: ->
    #   ## we want to get all the .click() .type() commands here
    #   ## rename this method to something like actions / traversal vs finders
    #   return @getSequenceObject() if @get("sequence") or not @get("selector")
    #
    #   @convertToArray
    #     "Prev Obj:   ": if @hasParent() then @parent.el
    #     "Command:    ": @get("method")
    #     "Selector:   ": @get("selector")
    #     "Returned:   ": @el
    #     "Elements:   ": @get("length")
    #     "Error:      ": @get("error")

    # getSequenceObject: ->
    #   @convertToArray
    #     "Command:    ": @get("method")
    #     "Sequence:   ": @get("sequence")
    #     "Applied To: ": if @hasParent() then @parent.el
    #     "Elements:   ": @get("length")
    #     "Error:      ": @get("error")

    getStubObject: ->
      stub = @stub
      stubCall = @stubCall
      stubObj = @stubObj

      _.defer =>
        @logSpyOrStubTableProperties(stub, stubCall)

      @convertToArray
        "Stub:         %O": stub
        "Stubbed Obj: ": stubObj
        "Calls:       ": stub.callCount

    getSpyObject: ->
      spy = @spy
      spyCall = @spyCall
      spyObj = @spyObj

      _.defer =>
        @logSpyOrStubTableProperties(spy, spyCall)

      @convertToArray
        "Spy:      %O": spy
        "Spy Obj: ": spyObj
        "Calls:   ": spy.callCount

    # getVisitObject: ->
    #   @convertToArray
    #     "Command:  ": @get("method")
    #     "URL:      ": @get("message")
    #     "Page:     ": @page.contents()

    logSpyOrStubTableProperties: (spyOrStub, spyOrStubCall) ->
      count = spyOrStub.callCount
      return if count is 0

      ## if spyOrStubCall is passed in just log out this
      ## specific spyOrStubCall as opposed to all of them
      ## use its num - 1 for 0 based indexes
      if spyOrStubCall
        @logSpyOrStubCall(spyOrStub, spyOrStubCall.num - 1)
      else
        for i in [0..count - 1]
          @logSpyOrStubCall(spyOrStub, i)

    logSpyOrStubCall: (spyOrStub, index) ->
      console.group("Call ##{index + 1}:")
      # console.log.apply(console, @getSpyArgsForCall(spyOrStub, i))
      @logSpyProperty("Arguments:  %O", spyOrStub.args[index])
      @logSpyProperty("Context:   ", spyOrStub.thisValues[index])
      @logSpyProperty("Returned:  ", spyOrStub.returnValues[index])

      exception = spyOrStub.exceptions[index]
      if exception
        @logSpyProperty("Error:     ", exception)
        @logSpyProperty("Stack:     ", exception.stack)

      console.groupEnd()

    logSpyProperty: (key, value) ->
      console.log "%c#{key}", "color: blue", value

    getXhrObject: ->
      ## return the primary xhr object
      ## if we dont have a response
      if not @get("response")
        return @convertToArray
          "Command: ": @get("method")
          "URL:     ": @xhr.url
          "Request: ": @xhr

      response = @xhr.responseText

      try
        response = JSON.parse response

      @convertToArray
        "Command:    ": @get("method")
        "Status:     ": @xhr.status
        "URL:        ": @xhr.url
        "Matched URL:": @response.url
        "Request:    ": @xhr
        "Response:   ": response

    # getAssertion: ->
    #   @convertToArray
    #     "Command:  ": @get("method")
    #     "Selector  ": @get("selector")
    #     "Subject:  ": @subject
    #     "Expected: ": @expected
    #     "Actual:   ": @actual
    #     "Message:  ": @get("message")

    getServer: ->
      @convertToArray
        "Command:   ": @get("method")
        "Server:    ": @server
        "Requests:  ": @requests
        "Responses: ": @responses
        "Queue:     ": (@requests.length - @responses.length)

  class Entities.CommandsCollection extends Entities.Collection
    model: Entities.Command

    initialize: ->
      new Backbone.SingleChooser(@)

    ## returns the original command
    ## from this cloned command
    getOriginalByClone: (command) ->
      @get command.get("clonedFrom")

    parentExistsFor: (command) ->
      if command.is("child")
        _.last @where({type: "parent"})

    getCommandIndex: (command) ->
      @indexOf(command) + 1

    maxNumber: ->
      ## set to 0 if its undefined
      @_maxNumber ?= 0

      ## incremental by one
      @_maxNumber += 1

    # ## check to see if the last parent command
    # ## is the passed in parent
    # lastParentCommandIsNotParent: (parent, command) ->
    #   ## loop through this in reverse
    #   ## cannot reverse the models array
    #   ## and use _.find because .clone()
    #   ## is throwing an error
    #   for model in @models by -1
    #     ## exclude ourselves since we recursively check
    #     ## up the parent chains
    #     if model.get("canBeParent")
    #       return model isnt parent

    # lastParentsAreNotXhr: (parent, command) ->
    #   for model in @models by -1
    #     ## if any of the parents arent xhr's return true
    #     return true if model.get("type") isnt "xhr"

    #     ## if we eventually make it to our parent then
    #     ## return false
    #     return false if model is parent

    # cloneParent: (parent) ->
    #   ## get a clone of our parent but reset its id
    #   clone = parent.clone()

    #   ## also remove its number
    #   clone.unset "number"

    #   clone.set
    #     id: _.uniqueId("cloneId")
    #     isCloned: true
    #     clonedFrom: parent.id

    #   _.each ["el", "xhr", "response", "parent"], (prop) ->
    #     clone[prop] = parent[prop]

    #   @add clone

    # getCommandByType: (attrs) ->
    #   switch attrs.type
    #     when "dom"          then @addDom attrs
    #     when "xhr"          then @addXhr attrs
    #     when "assertion"    then @addAssertion attrs
    #     when "server"       then @addServer attrs
    #     when "spy"          then @addSpy attrs
    #     when "stub"         then @addStub attrs
    #     when "visit"        then @addVisit attrs
    #     when "localStorage" then @addLocalStorage attrs
    #     else throw new Error("Command .type did not match anything")

    # insertParents: (command, parentId, options = {}) ->
    #   if parent = @parentExistsFor(parentId)

    #     ## make sure the last command is our parent, if its not
    #     ## then re-insert it (as a new model) and reset which
    #     ## one is our parent

    #     ## right here we need to potentially insert multiple parents
    #     ## in case we've referenced an ecl object way down the line
    #     if options.if and options.if.call(@, parent, command)
    #       ## recursively walk up the parent chain by ensuring we insert
    #       ## as many parents as necessary to get back to the root command
    #       @insertParents(parent, parent.parent.id, options) if parent.hasParent()

    #       parent = @cloneParent(parent)

    #     command.setParent parent
    #     command.indent()
    #     options.onSetParent.call(@, parent) if options.onSetParent

    # getIndexByParent: (command) ->
    #   return if not command.hasParent()

    #   @getCommandIndex(command.parent)

    anyFailed: ->
      @any (command) -> command.get("error")

    getTotalNumber: ->
      @_maxNumber

    # getXhrOptions: (command, options) ->
    #   ## at the very last minute we splice in this
    #   ## new command by figuring out what its parents
    #   ## index is (if this is an xhr)

    #   index = @getIndexByParent(command)
    #   options.at = index if index
    #   options

    # addSpy: (attrs) ->
    #   {spy, spyCall, spyObj, snapshot} = attrs

    #   attrs = _(attrs).omit "spy", "spyCall", "snapshot", "spyObj"

    #   command = new Entities.Command attrs
    #   command.spy = spy
    #   command.spyCall = spyCall
    #   command.spyObj = spyObj
    #   command.snapshot = snapshot

    #   @insertParents command, attrs.parent,
    #     if: (parent, cmd) ->
    #       @lastParentCommandIsNotParent(parent, cmd)

    #   return command

    # addStub: (attrs) ->
    #   {stub, stubCall, stubObj, snapshot} = attrs

    #   attrs = _(attrs).omit "stub", "stubCall", "snapshot", "stubObj"

    #   command = new Entities.Command attrs
    #   command.stub = stub
    #   command.stubCall = stubCall
    #   command.stubObj = stubObj
    #   command.snapshot = snapshot

    #   @insertParents command, attrs.parent,
    #     if: (parent, cmd) ->
    #       @lastParentCommandIsNotParent(parent, cmd)

    #   return command

    # addAssertion: (attrs) ->
    #   {snapshot, el, actual, expected, subject} = attrs

    #   attrs = _(attrs).omit "snapshot", "el", "actual", "expected", "subject"

    #   ## instantiate the new model
    #   command = new Entities.Command attrs
    #   command.snapshot = snapshot
    #   command.el = el
    #   command.actual = actual
    #   command.expected = expected
    #   command.subject = subject

    #   return command

    # addDom: (attrs) ->
    #   {el, snapshot} = attrs

    #   attrs = _(attrs).omit "el", "snapshot"

    #   ## instantiate the new model
    #   command = new Entities.Command attrs
    #   command.snapshot = snapshot
    #   command.el = el

    #   ## if we're chained to an existing id
    #   ## that means we have a parent
    #   @insertParents command, attrs.parent,

    #     ## insert a parent if the last parent command
    #     ## is not these arguments
    #     if: (parent, cmd) ->
    #       @lastParentCommandIsNotParent(parent, cmd)

    #   return command

    # addXhr: (attrs) ->
    #   {xhr, response, snapshot} = attrs

    #   attrs = _(attrs).omit "xhr", "response", "snapshot"

    #   ## instantiate the new model
    #   command = new Entities.Command attrs
    #   command.xhr = xhr
    #   command.snapshot = snapshot
    #   command.setResponse(response) if response

    #   # @insertParents command, attrs.parent,
    #     ## insert a parent if the last parent commands
    #     ## are not xhr types
    #     # if: (parent, cmd) ->
    #       # @lastParentsAreNotXhr(parent, cmd)

    #     ## when the parent is set on this child command
    #     ## set the response for it
    #     # onSetParent: (parent) ->
    #       # command.setResponse response


    #   return command

    # addServer: (attrs) ->
    #   {snapshot, requests, responses, server} = attrs

    #   attrs = _(attrs).omit "requests", "responses", "server"

    #   command = new Entities.Command attrs
    #   command.snapshot       = snapshot
    #   command.requests  = requests
    #   command.responses = responses
    #   command.server    = server

    #   return command

    # addVisit: (attrs) ->
    #   {page} = attrs

    #   attrs = _(attrs).omit "page"

    #   command = new Entities.Command attrs
    #   command.page = page

    #   return command

    # addLocalStorage: (attrs) ->
    #   {snapshot} = attrs

    #   attrs = _(attrs).omit "snapshot"

    #   ## instantiate the new model
    #   command = new Entities.Command attrs
    #   command.snapshot = snapshot

    #   return command

    createCommand: (attrs) ->
      publicAttrs = {}

      ## split up public from private properties
      _.each attrs, (value, key) ->
        ## if this is a function
        ## OR if the first character of the key is a: _
        ## OR it has a DOM element

        ## do not add it to the publicAttrs
        ## --extract this to a method--
        if not (_.isFunction(value) or key[0] is "_" or (value and value[0] and _.isElement(value[0])))
          publicAttrs[key] = value

      command = new Entities.Command publicAttrs

      command[CYPRESS_ATTRS] = attrs

      return command

    add: (attrs, hook) ->
      command = attrs
      options = hook

      ## if we have both of these methods assume this is
      ## a backbone model
      if command and command.set and command.get
        options = @getXhrOptions(command, options) if command.get("type") is "xhr"

        ## increment the number if its not cloned
        command.increment(@maxNumber()) unless command.isCloned()

        if parent = @parentExistsFor(command)
          command.setParent(parent)
          command.indent()

        return super(command, options)

      return if _.isEmpty attrs

      # _.extend attrs,
      #   type: type
      #   testId: id
      #   hook: hook

      super @createCommand(attrs)

    reset: ->
      @_maxNumber = 0
      chosen = @getFirstChosen()
      @unchoose(chosen, {silent: true}) if chosen
      @invoke "reset"
      super

  App.reqres.setHandler "command:entities", ->
    new Entities.CommandsCollection