do ($Cypress, _) ->

  aliasRe = /^@.+/
  aliasDisplayRe = /^([@]+)/

  $Cypress.Cy.extend
    assign: (str, obj) ->
      @private("runnable").ctx[str] = obj

    ## these are public because its expected other commands
    ## know about them and are expected to call them
    getNextAlias: ->
      next = @prop("current").next
      if next and next.name is "as"
        next.args[0]

    getAlias: (name, command) ->
      aliases = @prop("aliases") ? {}

      ## bail if the name doesnt reference an alias
      return if not aliasRe.test(name)

      ## slice off the '@'
      if not alias = aliases[name.slice(1)]
        @aliasNotFoundFor(name, command)

      return alias

    _aliasDisplayName: (name) ->
      name.replace(aliasDisplayRe, "")

    getAvailableAliases: ->
      return [] if not aliases = @prop("aliases")

      _(aliases).keys()

    aliasNotFoundFor: (name, command) ->
      availableAliases = @getAvailableAliases()

      ## throw a very specific error if our alias isnt in the right
      ## format, but its word is found in the availableAliases
      if (not aliasRe.test(name)) and (name in availableAliases)
        @throwErr "Invalid alias: '#{name}'. You forgot the '@'. It should be written as: '@#{@_aliasDisplayName(name)}'."

      command ?= @prop("current").name
      @throwErr "cy.#{command}() could not find a registered alias for: '#{@_aliasDisplayName(name)}'. Available aliases are: '#{availableAliases.join(", ")}'."

    _forceLoggingOptions: (args) ->
      ## if the obj has options and
      ## log is false, set it to true
      for arg, i in args by -1
        if _.isObject(arg) and (arg.log is false or arg.command)
          opts = _.clone(arg)
          opts.log = true
          delete opts.command
          args[i] = opts
          return

    ## recursively inserts previous objects
    ## up until it finds a parent command
    _replayFrom: (current, memo = []) ->
      ## reset each chainerId to the
      ## current value
      chainerId = @prop("chainerId")

      insert = =>
        _.each memo, (obj) =>
          @_forceLoggingOptions(obj.args)
          obj.chainerId = chainerId
          @_insert(obj)

      if current
        memo.unshift current

        if current.type is "parent"
          insert()
        else
          @_replayFrom current.prev, memo
      else
        insert()

    # cy
    #   .server()
    #   .route("/users", {}).as("u")
    #   .query("body").as("b")
    #   .query("div").find("span").find("input").as("i")
    #   .query("form").wait ($form) ->
    #     expect($form).to.contain("foo")
    #   .find("div").find("span:first").find("input").as("i2")
    #   .within "@b", ->
    #     cy.query("button").as("btn")

    ## DIFFICULT ALIASING SCENARIOS
    ## 1. You have a row of 5 todos.  You alias the last row. You insert
    ## a new row.  Does alias point to the NEW last row or the existing one?

    ## 2. There is several action(s) to make up an element.  You click #add
    ## which pops up a form, and alias the form.  You fill out the form and
    ## click submit.  This clears the form.  You then use the form alias.  Does
    ## it repeat the several steps which created the form in the first place?
    ## does it simply say the referenced form cannot be found?

    ## IF AN ALIAS CAN BE FOUND
    ## cy.get("form").find("input[name='age']").as("age")
    ## cy.get("@age").type(28)
    ## GET 'form'
    ##   FIND 'input[name='age']'
    ##     AS 'age'
    ##
    ## GET '@age'
    ##   TYPE '28'
    ##
    ## IF AN ALIAS CANNOT BE FOUND
    ## ALIAS '@age' NO LONGER IN DOCUMENT, REQUERYING, REPLAYING COMMANDS
    ## GET 'form'
    ##   FIND 'input[name='age']'
    ##     TYPE '28'
