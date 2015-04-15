@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  ## this is another good candidate for a mutator
  ## with stripping out the parent selector

  class Entities.Command extends Entities.Model
    defaults: ->
      indent: 0
      number: 0
      pause: false
      revert: false
      visible: true

    mutators:
      isPending: ->
        @state("pending")

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

      visibleMessage: ->
        return if @get("visible")

        if @get("numElements") > 1
          "One or more matched elements are not visible."
        else
          "This element is not visible."

    state: (state) ->
      @get("state") is state

    reset: ->
      @clear(silent: true)
      @clear(silent: true)

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
      if _.isFunction(fn = @getLog().get(name))
        fn.apply(@getLog().attributes, args)

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

    hasSnapshot: ->
      !!@getLog().get("snapshot")

    getSnapshot: ->
      @getLog().get("snapshot")

    getEl: ->
      @getLog().get("$el")

    getRoute: ->
      @getLog().get("_route")

    getLog: ->
      @log or throw new Error("Command is missing its log reference!")

    getConsoleDisplay: (fn) ->
      obj = @triggerCommandCallback("onConsole", @getLog().attributes)

      return if _.isEmpty(obj)

      groups = @formatGroupsForConsole(obj)

      obj = @formatForConsole(obj)

      _.each obj, (value, key) ->
        fn ["%c" + key, "font-weight: bold;", value] unless _.isBlank(value) and value isnt ""

      if groups
        _.each groups, (group) ->
          console.group(group.name)

          _.each group.items, (value, key) ->
            fn ["%c" + key, "color: blue", value]

          console.groupEnd()

    formatGroupsForConsole: (obj) ->
      return if not obj.groups

      if groups = _.result(obj, "groups")
        delete obj.groups

        _.map groups, (group) =>
          group.items = @formatForConsole(group.items)
          group

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

    anyFailed: ->
      @any (command) -> command.get("error")

    getTotalNumber: ->
      @_maxNumber

    createCommand: (log) ->
      if log.get("type") not in ["parent", "child"]
        throw new Error("Commands may only have type of 'parent' or 'child'.  Command was: {name: #{log.get('name')}, type: #{log.get('type')}}")

      attrs = ["state", "testId", "hookName", "type", "highlightAttr", "name", "alias", "aliasType", "referencesAlias", "message", "numElements", "numRetries", "visible"]

      command = new Entities.Command log.pick.apply(log, attrs)
      command.log = log

      command.listenTo log, "attrs:changed", (attrs) ->
        command.set attrs

      return command

    add: (attrs, hook) ->
      command = attrs
      options = hook

      if @isModelInstance(command)

        ## increment the number if its not cloned
        command.increment(@maxNumber()) unless command.isCloned()

        if parent = @parentExistsFor(command)
          command.setParent(parent)
          command.indent()

        return super(command, options)

      return if _.isEmpty attrs

      super @createCommand(attrs)

    reset: ->
      @_maxNumber = 0
      chosen = @getFirstChosen()
      @unchoose(chosen, {silent: true}) if chosen
      @invoke "reset"
      super

  App.reqres.setHandler "command:entities", ->
    new Entities.CommandsCollection