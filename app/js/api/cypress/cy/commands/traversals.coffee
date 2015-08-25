$Cypress.register "Traversals", (Cypress, _, $) ->

  traversals = "find filter not children eq closest first last next parent parents prev siblings".split(" ")

  _.each traversals, (traversal) ->
    Cypress.addChildCommand traversal, (subject, arg1, arg2, options) ->
      @ensureDom(subject)

      if _.isObject(arg2)
        options = arg2

      if _.isObject(arg1)
        options = arg1

      options ?= {}

      _.defaults options, {log: true}

      @ensureNoCommandOptions(options)

      getSelector = ->
        args = _([arg1, arg2]).chain().reject(_.isFunction).reject(_.isObject).value()
        args = _(args).without(null, undefined)
        args.join(", ")

      onConsole = {
        Selector: getSelector()
        "Applied To": $Cypress.Utils.getDomElements(subject)
      }

      if options.log
        options.command ?= Cypress.Log.command
          message: getSelector()
          onConsole: -> onConsole

      setEl = ($el) ->
        return if options.log is false

        onConsole.Returned = Cypress.Utils.getDomElements($el)
        onConsole.Elements = $el?.length

        options.command.set({$el: $el})

      checkToAutomaticallyRetry = (count, $el) ->
        ## we should automatically retry querying
        ## if we did not have any upcoming assertions
        ## and our $el's length was 0, because that means
        ## the element didnt exist in the DOM and the user
        ## did not explicitly request that it does not exist
        return if count isnt 0 or ($el and $el.length)

        ## throw here to cause the .catch to trigger
        throw new Error()

      do getElements = =>
        ## catch sizzle errors here
        try
          $el = subject[traversal].call(subject, arg1, arg2)
        catch e
          e.onFail = -> options.command.error(e)
          throw e

        setEl($el)

        @verifyUpcomingAssertions($el)
          .then (count) ->
            ## ensureCountOrElLength
            checkToAutomaticallyRetry(count, $el)
          .return({
            subject: $el
            command: options.command
          })
          .catch (err) =>
            @_retry getElements, options

        # getErr = =>
        #   node = Cypress.Utils.stringifyElement(subject, "short")
        #   err = @_elCommandOptionsError($el, options)
        #   err += " " + getSelector() + " from #{node}"

        # options.error ?= getErr()

        # @_retry(getElements, options)