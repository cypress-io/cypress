do (Cypress, _) ->

  Cypress.addParentCommand
    get: (selector, options = {}) ->
      _.defaults options,
        retry: true
        withinSubject: @prop("withinSubject")

      log = ($el) ->
        return if options.log is false

        Cypress.log
          $el: $el
          onConsole: ->
            obj = {"Command":  "get"}
            key = if alias then "Alias" else "Selector"
            obj[key] = selector
            _.extend obj,
              "Returned": $el
              "Elements": $el.length

      if alias = @getAlias(selector)
        {subject, command} = alias
        if subject and subject.get and _.isElement(subject.get(0))
          el = subject.get(0)
          if @_contains(el)
            log(subject)
            return subject
          else
            @_replayFrom command
            return null

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
        ## return the el if it has a length or we've explicitly
        ## disabled retrying
        if $el.length or options.retry is false
          log($el)
          return $el

      retry = ->
        @command("get", selector, options)

      ## if we REALLY want to be helpful and intelligent then
      ## if we time out, we should look at our aliases and see
      ## if our selector matches any aliases without the '@'
      ## if it did, then perhaps the user forgot to write '@'
      options.error ?= "Could not find element: #{selector}"

      @_retry(retry, options)

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

      phrase = switch
        when filter
          "within the selector: '#{filter}'"
        when subject
          node = Cypress.Utils.stringifyElement(subject, "short")
          "within the element: #{node}"
        else
          "in any elements"

      _.extend options,
        error: "Could not find any content: '#{text}' #{phrase}"
        withinSubject: subject
        filter: true
        log: false

      log = ($el) ->
        Cypress.log({
          $el: $el
          type: if subject then "child" else "parent"
          onConsole: ->
            "Content": text
            "Applied To": subject
            "Returned": $el
            "Elements": $el.length
        })
        return $el

      containsTextNode = ($el, text) ->
        contents = $el.contents().filter( -> @nodeType is 3).text()
        _.str.include(contents, text)

      ## find elements by the :contains psuedo selector
      ## and any submit inputs with the attributeContainsWord selector
      selector = "#{filter}:contains('#{text}'), #{filter}[type='submit'][value~='#{text}']"

      @command("get", selector, options).then (elements) ->
        return log(elements.first()) if filter

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