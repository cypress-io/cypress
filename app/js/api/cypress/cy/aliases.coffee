do ($Cypress, _) ->

  aliasRe = /^@.+/
  aliasDisplayRe = /^([@]+)/

  $Cypress.Cy.extend
    assign: (str, obj) ->
      @private("runnable").ctx[str] = obj

    ## these are public because its expected other commands
    ## know about them and are expected to call them
    getNextAlias: ->
      next = @prop("current").get("next")
      if next and next.get("name") is "as"
        next.get("args")[0]

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

      command ?= @prop("current").get("name")
      @throwErr "cy.#{command}() could not find a registered alias for: '#{@_aliasDisplayName(name)}'. Available aliases are: '#{availableAliases.join(", ")}'."

    _forceLoggingOptions: (args) ->
      ## if the obj has options and
      ## log is false, set it to true
      for arg, i in args by -1
        if _.isObject(arg) and (arg.log is false or arg._log)
          opts = _.clone(arg)
          opts.log = true
          delete opts._log
          args[i] = opts
          return

    _getCommandsUntilFirstParentOrValidSubject: (command, memo = []) ->
      return null if not command

      ## push these onto the beginning of the commands array
      memo.unshift(command)

      ## break and return the memo
      if command.get("type") is "parent" or @_contains(command.get("subject"))
        return memo

      @_getCommandsUntilFirstParentOrValidSubject(command.get("prev"), memo)

    ## recursively inserts previous commands
    _replayFrom: (current) ->
      ## reset each chainerId to the
      ## current value
      chainerId = @prop("chainerId")

      insert = (commands) =>
        _.each commands, (cmd) =>
          @_forceLoggingOptions(cmd.get("args"))
          cmd.set("chainerId", chainerId)

          ## clone the command to prevent
          ## mutating its properties
          @insertCommand cmd.clone()

      ## - starting with the aliased command
      ## - walk up to each prev command
      ## - until you reach a parent command
      ## - or until the subject is in the DOM
      ## - from that command walk down inserting
      ##   every command which changed the subject
      ## - coming upon an assertion should only be
      ##   inserted if the previous command should
      ##   be replayed

      commands = @_getCommandsUntilFirstParentOrValidSubject(current)

      if commands
        initialCommand = commands.shift()

        insert _.reduce commands, (memo, command, index) ->
          push = ->
            memo.push(command)

          switch
            when command.get("type") is "assertion"
              ## if we're an assertion and the prev command
              ## is in the memo, then push this one
              if command.get("prev") in memo
                push()

            when command.get("subject") isnt initialCommand.get("subject")
              ## when our subjects dont match then
              ## reset the initialCommand to this command
              ## so the next commands can compare against
              ## this one to figure out the changing subjects
              initialCommand = command

              push()

          return memo

        , [initialCommand]

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
