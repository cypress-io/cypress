do (Cypress, _) ->

  traversals = "find filter children eq closest first last next parent parents prev siblings".split(" ")

  _.each traversals, (traversal) ->
    Cypress.addChildCommand traversal, (subject, arg1, arg2, options) ->
      @ensureDom(subject)

      if _.isObject(arg2)
        options = arg2

      if _.isObject(arg1)
        options = arg1

      options ?= {}

      _.defaults options,
        visible: true
        exist: true
        exists: true

      ## normalize these two options
      options.exist = options.exists and options.exist

      getSelector = ->
        args = _([arg1, arg2]).chain().reject(_.isFunction).value()
        args = _(args).without(null, undefined)
        args.join(", ")

      log = ($el) ->
        Cypress.command
          $el: $el
          onConsole: ->
            obj = {}
            obj.Selector = getSelector()

            _.extend obj,
              "Applied To":   subject
              "Returned":     $el
              "Elements":     $el?.length

        return $el

      ## instead of applying directly to the subject
      ## shouldnt modifiers go through the same logic
      ## as #get where we potentially retry several times?
      $el = subject[traversal].call(subject, arg1, arg2)

      length = $el.length

      switch
        when options.exist is false
          ## return if we didnt find anything and our options have asked
          ## us for the element not to exist
          if not length
            return log(null)

        when options.visible is false
          ## make sure all the $el's are hidden
          if length and length is $el.filter(":hidden").length
            return log($el)

        else
          ## return the el if it has a length or we've explicitly
          ## disabled retrying
          ## make sure all of the $el's are visible!
          if (length and length is $el.filter(":visible").length) or options.retry is false
            return log($el)

      retry = ->
        @command(@prop("current").name, arg1, arg2, options)

      getErr = ->
        err = switch
          when options.exist is false #and not $el.length
            "Found existing element:"
          when options.visible is false and $el.length
            "Found visible element:"
          else
            if not $el.length
              "Could not find element:"
            else
              "Could not find visible element:"

        err += " " + getSelector()

      options.error ?= getErr()

      @_retry(retry, options)