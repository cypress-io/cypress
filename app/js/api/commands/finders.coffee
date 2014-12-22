do (Cypress, _) ->

  Cypress.addRoot

    within: (selector, fn) ->

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

      if alias = @_alias(selector)
        {subject, command} = alias
        if subject and subject.get and _.isElement(subject.get(0))
          el = subject.get(0)
          if @_contains(el)
            return subject
          else
            @_replayFrom command.prev
            return null

      $el = @$(selector)

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