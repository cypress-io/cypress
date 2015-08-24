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

      _.defaults options,
        length: null
        visible: null
        exist: true
        exists: true
        log: true

      ## normalize these two options
      options.exist = options.exists and options.exist

      ## figure out the options which actually change the behavior of traversals
      deltaOptions = Cypress.Utils.filterDelta(options, {visible: null, exist: true, length: null})

      getSelector = ->
        args = _([arg1, arg2]).chain().reject(_.isFunction).reject(_.isObject).value()
        args = _(args).without(null, undefined)
        args.join(", ")

      onConsole = {
        Selector: getSelector()
        Options: deltaOptions
        "Applied To": $Cypress.Utils.getDomElements(subject)
      }

      if options.log
        options.command ?= Cypress.Log.command
          message: _.compact([getSelector(), deltaOptions])
          onConsole: -> onConsole

      log = ($el) ->
        return $el if not options.command

        _.extend onConsole,
          "Returned": $Cypress.Utils.getDomElements($el)
          "Elements": $el?.length

        options.command.set({$el: $el})

        options.command.snapshot()

        return {subject: $el, command: options.command}

      setEl = ($el) ->
        return if options.log is false

        onConsole.Returned = Cypress.Utils.getDomElements($el)
        onConsole.Elements = $el?.length

        options.command.set({$el: $el})

      do getElements = =>
        ## catch sizzle errors here
        try
          $el = subject[traversal].call(subject, arg1, arg2)
        catch e
          e.onFail = -> options.command.error(e)
          throw e

        setEl($el)

        ret = @_elMatchesCommandOptions($el, options)
        ## verify our $el matches the command options
        ## and if this didnt return undefined bail
        ## and log out the ret value
        unless ret is false
          return log(ret)

        getErr = =>
          node = Cypress.Utils.stringifyElement(subject, "short")
          err = @_elCommandOptionsError($el, options)
          err += " " + getSelector() + " from #{node}"

        options.error ?= getErr()

        @_retry(getElements, options)