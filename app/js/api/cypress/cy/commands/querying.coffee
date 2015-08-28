$Cypress.register "Querying", (Cypress, _, $) ->

  priorityElement = "input[type='submit'], button, a, label"

  Cypress.addParentCommand
    get: (selector, options = {}) ->
      _.defaults options,
        retry: true
        withinSubject: @prop("withinSubject")
        log: true
        command: null
        verify: true

      @ensureNoCommandOptions(options)

      onConsole = {}

      start = (aliasType) ->
        return if options.log is false

        options.command ?= Cypress.Log.command
          message: selector
          referencesAlias: aliasObj?.alias
          aliasType: aliasType
          onConsole: -> onConsole

      log = (value, aliasType = "dom") ->
        return if options.log is false

        start(aliasType) if not options.command

        obj = {}

        if aliasType is "dom"
          _.extend obj,
            $el: value
            numRetries: options.retries

        obj.onConsole = ->
          key = if aliasObj then "Alias" else "Selector"
          onConsole[key] = selector

          switch aliasType
            when "dom"
              _.extend onConsole,
                Returned: Cypress.Utils.getDomElements(value)
                Elements: value?.length

            when "primitive"
              _.extend onConsole,
                Returned: value

            when "route"
              _.extend onConsole,
                Returned: value

          return onConsole

        options.command.set(obj)

      ## we always want to strip everything after the first '.'
      ## since we support alias propertys like '1' or 'all'
      if aliasObj = @getAlias(selector.split(".")[0])
        {subject, alias, command} = aliasObj

        switch
          ## if this is a DOM element
          when Cypress.Utils.hasElement(subject)
            if @_contains(subject)
              log(subject)
              return {subject: subject, command: options.command}
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

      setEl = ($el) ->
        return if options.log is false

        onConsole.Returned = Cypress.Utils.getDomElements($el)
        onConsole.Elements = $el?.length

        options.command.set({$el: $el})

      getElements = =>
        ## attempt to query for the elements by withinSubject context
        ## and catch any sizzle errors!
        try
          $el = @$(selector, options.withinSubject)
        catch e
          e.onFail = -> options.command.error(e)
          throw e

        ## if that didnt find anything and we have a within subject
        ## and we have been explictly told to filter
        ## then just attempt to filter out elements from our within subject
        if not $el.length and options.withinSubject and options.filter
          filtered = options.withinSubject.filter(selector)

          ## reset $el if this found anything
          $el = filtered if filtered.length

        ## store the $el now in case we fail
        setEl($el)

        ## allow retry to be a function which we ensure
        ## returns truthy before returning its
        if _.isFunction(options.onRetry)
          if ret = options.onRetry.call(@, $el)
            log($el)
            return ret
        else
          log($el)
          return $el

      do resolveElements = =>
        Promise.try(getElements).then ($el) =>
          if options.verify is false
            return $el

          @verifyUpcomingAssertions($el, options, {
            onRetry: resolveElements
          })

    root: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        command = Cypress.Log.command({message: ""})

      log = ($el) ->
        command.set({$el: $el}) if command

        return {subject: $el, command: command}

      if withinSubject = @prop("withinSubject")
        return log(withinSubject)

      @command("get", "html", {log: false}).then (ret) ->
        log(ret.subject)

  Cypress.addDualCommand
    contains: (subject, filter, text, options = {}) ->
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

      _.defaults options, {log: true}

      @ensureNoCommandOptions(options)

      @throwErr "cy.contains() can only accept a string or number!" if not (_.isString(text) or _.isFinite(text))
      @throwErr "cy.contains() cannot be passed an empty string!" if _.isBlank(text)

      getPhrase = (type, negated) ->
        switch
          when filter
            "within the selector: '#{filter}' "
          when subject
            node = Cypress.Utils.stringifyElement(subject, "short")
            "within the element: #{node} "
          else
            ""

      getErr = (err) ->
        {type, negated, node} = err

        switch type
          when "existence"
            if negated
              "Expected not to find content: '#{text}' #{getPhrase(type, negated)}but continuously found it."
            else
              "Expected to find content: '#{text}' #{getPhrase(type, negated)}but never did."

      if options.log
        onConsole = {
          Content: text
          "Applied To": Cypress.Utils.getDomElements(subject or @prop("withinSubject"))
        }

        options.command ?= Cypress.Log.command
          message: _.compact([filter, text])
          type: if subject then "child" else "parent"
          onConsole: -> onConsole

      _.extend options,
        # error: getErr(text, phrase)
        withinSubject: subject or @prop("withinSubject") or @$("body")
        filter: true
        log: false
        # retry: false ## dont retry because we perform our own element validation
        verify: false ## dont verify upcoming assertions, we do that ourselves

      setEl = ($el) ->
        return if not options.command

        onConsole.Returned = Cypress.Utils.getDomElements($el)
        onConsole.Elements = $el?.length

        options.command.set({$el: $el})

      getFirstDeepestElement = (elements, index = 0) ->
        ## iterate through all of the elements in pairs
        ## and check if the next item in the array is a
        ## descedent of the current. if it is continue
        ## to recurse. if not, or there is no next item
        ## then return the current
        $current = elements.slice(index,     index + 1)
        $next    = elements.slice(index + 1, index + 2)

        return $current if not $next

        ## does current contain next?
        if $.contains($current.get(0), $next.get(0))
          getFirstDeepestElement(elements, index + 1)
        else
          ## return the current if it already is a priority element
          return $current if $current.is(priorityElement)

          ## else once we find the first deepest element then return its priority
          ## parent if it has one and it exists in the elements chain
          $priorities = elements.filter $current.parents(priorityElement)
          if $priorities.length then $priorities.last() else $current

      text = text.toString().replace /('|")/g, "\\$1"

      ## find elements by the :contains psuedo selector
      ## and any submit inputs with the attributeContainsWord selector
      selector = "#{filter}:not(script):contains('#{text}'), #{filter}[type='submit'][value~='#{text}']"

      checkToAutomaticallyRetry = (count, $el) ->
        ## we should automatically retry querying
        ## if we did not have any upcoming assertions
        ## and our $el's length was 0, because that means
        ## the element didnt exist in the DOM and the user
        ## did not explicitly request that it does not exist
        return if count isnt 0 or ($el and $el.length)

        ## throw here to cause the .catch to trigger
        throw new Error()

      do resolveElements = =>
        @command("get", selector, options).then ($elements) =>
          $el = switch
            when $elements and $elements.length and filter
              $elements.last()
            when $elements and $elements.length
              getFirstDeepestElement($elements)
            else
              $elements

          setEl($el)

          @verifyUpcomingAssertions($el, options, {
            onRetry: resolveElements
            onFail: (err) =>
              switch err.type
                when "length"
                  if err.expected > 1
                    @throwErr "cy.contains() cannot be passed a length option because it will only ever return 1 element.", options.command
                when "existence"
                  err.longMessage = getErr(err)
          })

  Cypress.addChildCommand
    within: (subject, options, fn) ->
      @ensureDom(subject)

      if _.isUndefined(fn)
        fn = options
        options = {}

      _.defaults options, {log: true}

      if options.log
        command = Cypress.Log.command
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

      fn.call @private("runnable").ctx, subject

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

      return {subject: subject, command: command}