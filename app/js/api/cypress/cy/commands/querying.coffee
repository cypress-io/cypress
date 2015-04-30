$Cypress.register "Querying", (Cypress, _, $) ->

  Cypress.addParentCommand
    get: (selector, options = {}) ->
      _.defaults options,
        retry: true
        withinSubject: @prop("withinSubject")
        visible: null
        exist: true
        exists: true
        log: true
        command: null

      ## normalize these two options
      options.exist = options.exists and options.exist

      ## figure out the options which actually change the behavior of traversals
      deltaOptions = Cypress.Utils.filterDelta(options, {visible: null, exist: true})

      start = (aliasType) ->
        return if options.log is false

        options.command ?= Cypress.command
          message: [selector, deltaOptions]
          referencesAlias: aliasObj?.alias
          aliasType: aliasType

      log = (value, aliasType = "dom") ->
        return if options.log is false

        start(aliasType) if not options.command

        obj = {}

        if aliasType is "dom"
          _.extend obj,
            $el: value
            numRetries: options.retries

        _.extend obj,
          onConsole: ->
            obj2 = {"Command":  "get"}
            key = if aliasObj then "Alias" else "Selector"
            obj2[key] = selector

            switch aliasType
              when "dom"
                _.extend obj2,
                  Options:  deltaOptions
                  Returned: value
                  Elements: value?.length

              when "primitive"
                _.extend obj2,
                  Returned: value

              when "route"
                _.extend obj2,
                  Returned: value

            return obj2

        options.command.set(obj).snapshot().end()

      ## we always want to strip everything after the first '.'
      ## since we support alias propertys like '1' or 'all'
      if aliasObj = @getAlias(selector.split(".")[0])
        {subject, alias, command} = aliasObj

        switch
          ## if this is a DOM element
          when Cypress.Utils.hasElement(subject)
            if @_contains(subject)
              log(subject)
              return subject
            else
              @_replayFrom command
              return null

          ## if this is a route command
          when command.name is "route"
            alias = _.compact([alias, selector.split(".")[1]]).join(".")
            responses = @getResponsesByAlias(alias) ? null
            log(responses, "route")
            return responses
          else
            ## log as primitive
            log(subject, "primitive")
            return subject

      start("dom")

      ## attempt to query for the elements by withinSubject context
      $el = @$(selector, options.withinSubject)

      ## if that didnt find anything and we have a within subject
      ## and we have been explictly told to filter
      ## then just attempt to filter out elements from our within subject
      if not $el.length and options.withinSubject and options.filter
        filtered = options.withinSubject.filter(selector)

        ## reset $el if this found anything
        $el = filtered if filtered.length

      ## allow retry to be a function which we ensure
      ## returns truthy before returning its
      if _.isFunction(options.retry)
        if ret = options.retry.call(@, $el)
          log($el)
          return ret
      else
        ## go into non-existing mode if we've forced ourselves
        ## not to find the element!
        length = $el.length

        switch
          when options.exist is false
            ## return if we didnt find anything and our options have asked
            ## us for the element not to exist
            if not length
              log(null)
              return null

          when options.visible is false
            ## make sure all the $el's are hidden
            if length and length is $el.filter(":hidden").length
              log($el)
              return $el

          when options.visible is true
            if length and length is $el.filter(":visible").length
              log($el)
              return $el

          else
            ## return the el if it has a length or we've explicitly
            ## disabled retrying
            ## make sure all of the $el's are visible!
            if length or options.retry is false
              log($el)
              return $el

      retry = ->
        @command("get", selector, options)

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

        err += " #{selector}"

      ## if we REALLY want to be helpful and intelligent then
      ## if we time out, we should look at our aliases and see
      ## if our selector matches any aliases without the '@'
      ## if it did, then perhaps the user forgot to write '@'
      options.error ?= getErr()

      @_retry(retry, options)

    root: ->
      command = Cypress.command({message: ""})

      log = ($el) ->
        command.set({$el: $el}).snapshot().end()

        return $el

      withinSubject = @prop("withinSubject")

      if withinSubject
        return log(withinSubject)

      @command("get", "html", {log: false}).then ($html) ->
        log($html)

  Cypress.addDualCommand
    contains: (subject, filter, text, options = {}) ->
      _.defaults options,
        log: true

      ## nuke our subject if its present but not an element
      ## since we want contains to operate as a parent command
      if subject and not Cypress.Utils.hasElement(subject)
        subject = null

      switch
        when _.isObject(text)
          options = text
          text = filter
          filter = ""
        when _.isUndefined(text)
          text = filter
          filter = ""

      @throwErr "cy.contains() can only accept a string or number!" if not (_.isString(text) or _.isFinite(text))
      @throwErr "cy.contains() cannot be passed an empty string!" if _.isBlank(text)

      phrase = switch
        when filter
          "within the selector: '#{filter}'"
        when subject
          node = Cypress.Utils.stringifyElement(subject, "short")
          if options.exist is false
            "within an existing element: #{node}"
          else
            "within the element: #{node}"
        else
          if options.exist is false
            "within any existing elements"
          else
            "in any elements"

      getErr = (text, phrase) ->
        err = switch
          when options.exist is false
            "Found content:"

          when options.visible is false
            "Found visible content:"

          else
            "Could not find any content:"

        err += " '#{text}' #{phrase}"

      if options.log
        onConsole = {
          Content: text
          "Applied To": subject or @prop("withinSubject")
        }

        options.command ?= Cypress.command
          type: if subject then "child" else "parent"
          onConsole: -> onConsole

      _.extend options,
        error: getErr(text, phrase)
        withinSubject: subject or @prop("withinSubject")
        filter: true
        log: false

      log = ($el) ->
        return $el if not options.command

        onConsole.Returned = $el
        onConsole.Elements = $el?.length

        options.command.set({$el: $el})

        options.command.snapshot().end()

        return $el

      containsTextNode = ($el, text) ->
        contents = $el.contents().filter( -> @nodeType is 3).text()
        _.str.include(contents, text)

      text = text.toString().replace /('|")/g, "\\$1"

      ## find elements by the :contains psuedo selector
      ## and any submit inputs with the attributeContainsWord selector
      selector = "#{filter}:contains('#{text}'), #{filter}[type='submit'][value~='#{text}']"

      @command("get", selector, options).then (elements) ->
        return log(null) if not elements

        return log(elements.last()) if filter

        ## iterate on the array of elements in reverse
        for el in elements.get() by -1
          ## return the element if it is a priority element
          $el = $(el)
          return log($el) if $el.is("input[type='submit'], button, a, label")

        for el in elements.get()
          $el = $(el)
          return log($el) if containsTextNode($el, text)

  Cypress.addChildCommand
    within: (subject, fn) ->
      @ensureDom(subject)

      command = Cypress.command
        $el: subject
        message: ""

      @throwErr("cy.within() must be called with a function!", command) if not _.isFunction(fn)

      ## reference the next command after this
      ## within.  when that command runs we'll
      ## know to remove withinSubject
      next = @prop("current").next

      ## backup the current withinSubject
      ## this prevents a bug where we null out
      ## withinSubject when there are nested .withins()
      ## we want the inner within to restore the outer
      ## once its done
      prevWithinSubject = @prop("withinSubject")
      @prop("withinSubject", subject)

      fn.call @prop("runnable").ctx

      command.snapshot().end()

      stop = =>
        @off "command:start", setWithinSubject

      ## we need a mechanism to know when we should remove
      ## our withinSubject so we dont accidentally keep it
      ## around after the within callback is done executing
      ## so when each command starts, check to see if this
      ## is the command which references our 'next' and
      ## if so, remove the within subject
      setWithinSubject = (obj) ->
        return if obj isnt next

        ## okay so what we're doing here is creating a property
        ## which stores the 'next' command which will reset the
        ## withinSubject.  If two 'within' commands reference the
        ## exact same 'next' command, then this prevents accidentally
        ## resetting withinSubject more than once.  If they point
        ## to differnet 'next's then its okay
        if next isnt @prop("nextWithinSubject")
          @prop "withinSubject", prevWithinSubject or null
          @prop "nextWithinSubject", next

        ## regardless nuke this listeners
        stop()

      ## if next is defined then we know we'll eventually
      ## unbind these listeners
      if next
        @on("command:start", setWithinSubject)
      else
        ## remove our listener if we happen to reach the end
        ## event which will finalize cleanup if there was no next obj
        @once "end", ->
          stop()
          @prop "withinSubject", null

      return subject