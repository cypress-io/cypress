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
      a = []
      ## push a 'subject' into here if its not the actual value
      ## this happens when there are really '3' involved objects
      ## such as jQuery expectations
      if @value isnt @actual or _.isUndefined(@expected)
        a.push ["Subject:  ", @value]

      if not _.isUndefined(@expected)
        a.push ["Expected: ", @expected]
        a.push ["Actual:   ", @actual]

      a.push ["Message:  ", @get("message")]

      a

  class Entities.CommandsCollection extends Entities.Collection
    model: Entities.Command

    parentExistsFor: (id) ->
      @get(id)

    lastCommandIsNot: (command) ->
      @last() isnt command

    insertParent: (parent) ->
      ## get a clone of our parent but reset its id
      clone = parent.clone()
      clone.id = _.uniqueId("cloneId")

      _.each ["el", "dom", "xhr", "response", "parent"], (prop) ->
        clone[prop] = parent[prop]

      @add clone

    getCommandByType: (attrs) ->
      switch attrs.type
        when "dom"        then @addDom attrs
        when "xhr"        then @addXhr attrs
        when "assertion"  then @addAssertion attrs

    handleParent: (command, parent) ->
      df = $.Deferred()

      if parent = @parentExistsFor(parent)
        ## make sure the last command is our parent, if its not
        ## then re-insert it (as a new model) and reset which
        ## one is our parent
        parent = @insertParent(parent) if @lastCommandIsNot(parent)

        command.setParent parent
        command.indent()
        df.resolve()

      df

    addAssertion: (attrs) ->
      {dom, actual, expected, value} = attrs
      attrs = _(attrs).omit "dom", "actual", "expected", "value"

      ## instantiate the new model
      command = new Entities.Command attrs
      command.dom = dom
      command.actual = actual
      command.expected = expected
      command.value = value

      return command

    addDom: (attrs) ->
      {el, dom} = attrs

      attrs = _(attrs).omit "el", "dom"

      attrs.highlight = true

      ## instantiate the new model
      command = new Entities.Command attrs
      command.dom = dom
      command.el = el

      ## if we're chained to an existing id
      ## that means we have a parent
      @handleParent(command, attrs.parent)

      return command

    addXhr: (attrs) ->
      {xhr, response, dom} = attrs

      attrs = _(attrs).omit "xhr", "response", "dom"

      ## instantiate the new model
      command = new Entities.Command attrs
      command.xhr = xhr
      command.dom = dom

      @handleParent(command, attrs.parent).done ->
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