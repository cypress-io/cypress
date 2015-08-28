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

      do getElements = =>
        ## catch sizzle errors here
        try
          $el = subject[traversal].call(subject, arg1, arg2)

          ## normalize the selector since jQuery won't have it
          ## or completely borks it
          $el.selector = getSelector()
        catch e
          e.onFail = -> options.command.error(e)
          throw e

        setEl($el)

        @verifyUpcomingAssertions($el, options, {
          onRetry: getElements
          onFail: (err) ->
            if err.type is "existence"
              node = $Cypress.Utils.stringifyElement(subject, "short")
              err.longMessage += " Queried from element: #{node}"
        })