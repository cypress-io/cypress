@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  ## this is another good candidate for a mutator
  ## with stripping out the parent selector

  class Entities.Command extends Entities.Model
    defaults: ->
      indent: 0
      pause: false
      revert: false

    mutators:
      selector: ->
        _.trim @stripParentSelector()

    indent: (indent) ->
      indent = @parent.get("indent")
      @set "indent", indent + 17

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
      @set "response", @xhr.responseText
      @set "method", "resp"
      @response = response

    getPrimaryObjects: ->
      objs = switch @get("type")
        when "xhr"        then @xhr
        when "dom"        then @el
        when "assertion"  then @getAssertion()

      _([objs]).flatten(true)

    getDom: ->
      @dom

    getEl: ->
      @el

    getAssertion: ->
      obj =
        "Subject:  ": @subject
        "Expected: ": @expected
        "Actual:   ": @actual
        "Message:  ": @get("message")

      _.reduce obj, (memo, value, key) ->
        memo.push [key, value] if value
        memo
      , []

  class Entities.CommandsCollection extends Entities.Collection
    model: Entities.Command

    parentExistsFor: (id) ->
      @get(id)

    ## check to see if the last parent command
    ## is the passed in parent
    lastParentCommandIsNot: (parent, command) ->
      ## loop through this in reverse
      ## cannot reverse the models array
      ## and use _.find because .clone()
      ## is throwing an error
      for model in @models by -1
        ## exclude ourselves since we recursively check
        ## up the parent chains
        if model.get("canBeParent")
          return model isnt parent

    cloneParent: (parent) ->
      ## get a clone of our parent but reset its id
      clone = parent.clone()
      clone.set
        id: _.uniqueId("cloneId")
        isCloned: true

      _.each ["el", "xhr", "response", "parent"], (prop) ->
        clone[prop] = parent[prop]

      @add clone

    getCommandByType: (attrs) ->
      switch attrs.type
        when "dom"        then @addDom attrs
        when "xhr"        then @addXhr attrs
        when "assertion"  then @addAssertion attrs

    insertParents: (command, parentId, cb) ->
      if parent = @parentExistsFor(parentId)

        ## make sure the last command is our parent, if its not
        ## then re-insert it (as a new model) and reset which
        ## one is our parent

        ## right here we need to potentially insert multiple parents
        ## in case we've referenced an ecl object way down the line
        if @lastParentCommandIsNot(parent, command)

          ## recursively walk up the parent chain by ensuring we insert
          ## as many parents as necessary to get back to the root command
          @insertParents(parent, parent.parent.id) if parent.hasParent()

          parent = @cloneParent(parent)

        command.setParent parent
        command.indent()
        cb() if cb


    addAssertion: (attrs) ->
      {dom, el, actual, expected, subject} = attrs
      attrs = _(attrs).omit "dom", "el", "actual", "expected", "subject"

      ## instantiate the new model
      command = new Entities.Command attrs
      command.dom = dom
      command.el = el
      command.actual = actual
      command.expected = expected
      command.subject = subject

      return command

    addDom: (attrs) ->
      {el, dom} = attrs

      attrs = _(attrs).omit "el", "dom"


      ## instantiate the new model
      command = new Entities.Command attrs
      command.dom = dom
      command.el = el

      ## if we're chained to an existing id
      ## that means we have a parent
      @insertParents command, attrs.parent

      return command

    addXhr: (attrs) ->
      {xhr, response, dom} = attrs

      attrs = _(attrs).omit "xhr", "response", "dom"

      ## instantiate the new model
      command = new Entities.Command attrs
      command.xhr = xhr
      command.dom = dom

      @insertParents command, attrs.parent, ->
        command.setResponse response

      return command

    add: (attrs, type, runnable) ->
      try
        ## bail if we're attempting to add a real model here
        ## instead of an object
        return super(attrs) if attrs instanceof Entities.Command

      return if _.isEmpty attrs

      _.extend attrs,
        type: type
        testId: runnable.cid

      command = @getCommandByType(attrs)

      super command

  App.reqres.setHandler "command:entities", ->
    new Entities.CommandsCollection