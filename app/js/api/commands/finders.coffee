do (Cypress, _) ->

  Cypress.addParentCommand

    contains: (filter, text, options = {}) ->
      switch
        when _.isObject(text)
          options = text
          text = filter
          filter = ""
        when _.isUndefined(text)
          text = filter
          filter = ""

      word = if filter then "the selector: <#{filter}>" else "any elements"
      options.error = "Could not find #{word} containing the content: #{text}"

      ## find elements by the :contains psuedo selector
      ## and any submit inputs with the attributeContainsWord selector
      selector = "#{filter}:contains('#{text}'), #{filter}[type='submit'][value~='#{text}']"

      @command("get", selector, options).then (elements) ->
        for filter in ["input[type='submit']", "button", "a"]
          filtered = elements.filter(filter)
          return filtered if filtered.length

        return elements.last()

    get: (selector, options = {}) ->
      _.defaults options,
        retry: true

      if alias = @getAlias(selector)
        {subject, command} = alias
        if subject and subject.get and _.isElement(subject.get(0))
          el = subject.get(0)
          if @_contains(el)
            return subject
          else
            @_replayFrom command
            return null

      $el = @$(selector, @prop("withinSubject"))

      ## allow retry to be a function which we ensure
      ## returns truthy before returning its
      if _.isFunction(options.retry)
        return ret if ret = options.retry.call(@, $el)
      else
        ## return the el if it has a length or we've explicitly
        ## disabled retrying
        return $el if $el.length or options.retry is false

      retry = ->
        @command("get", selector, options)

      ## if we REALLY want to be helpful and intelligent then
      ## if we time out, we should look at our aliases and see
      ## if our selector matches any aliases without the '@'
      ## if it did, then perhaps the user forgot to write '@'
      options.error ?= "Could not find element: #{selector}"

      @_retry(retry, options)

  Cypress.addChildCommand
    within: (subject, fn) ->
      @ensureDom(subject)

      @throwErr("cy.within() must be called with a function!") if not _.isFunction(fn)

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