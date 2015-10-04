do ($Cypress, _) ->

  $Cypress.Cy.extend
    cypressErr: (err) ->
      err = new Error(err)
      err.name = "CypressError"
      err

    throwErr: (err, onFail) ->
      if _.isString(err)
        err = @cypressErr(err)

      ## assume onFail is a command if
      ## onFail is present and isnt a function
      if onFail and not _.isFunction(onFail)
        command = onFail

        ## redefine onFail and automatically
        ## hook this into our command
        onFail = (err) ->
          command.error(err)

      err.onFail = onFail if onFail

      throw err

    ## submit a generic command error
    commandErr: (err) ->
      current = @prop("current")

      @Cypress.Log.command
        end: true
        snapshot: true
        error: err
        onConsole: ->
          obj = {}
          ## if type isnt parent then we know its dual or child
          ## and we can add Applied To if there is a prev command
          ## and it is a parent
          if current.get("type") isnt "parent" and prev = current.get("prev")
            ret = if $Cypress.Utils.hasElement(prev.get("subject"))
              $Cypress.Utils.getDomElements(prev.get("subject"))
            else
              prev.get("subject")

            obj["Applied To"] = ret
            obj

    endedEarlyErr: ->
      ## return if we already have an error
      return if @prop("err")

      err = @cypressErr("Cypress detected your test ended early before all of the commands have run. This can happen if you explicitly done() a test before all of the commands have finished.")
      err.onFail = ->
      @fail(err)

    fail: (err) ->
      current = @prop("current")

      ## allow for our own custom onFail function
      if err.onFail
        err.onFail.call(@, err)

        ## clean up this onFail callback
        ## after its been called
        delete err.onFail
      else
        @commandErr(err)

      runnable = @private("runnable")

      @prop("err", err)

      @Cypress.trigger "fail", err, runnable
      @trigger "fail", err, runnable