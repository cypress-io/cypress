$Cypress.register "Location", (Cypress, _, $) ->

  Cypress.Cy.extend
    _getLocation: (key) ->
      remoteUrl = @private("window").location.toString()
      location  = Cypress.Location.create(remoteUrl)

      if key
        location[key]
      else
        location

  Cypress.addParentCommand
    url: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options.command = Cypress.Log.command
          message: ""

      getHref = =>
        @_getLocation("href")

      do resolveHref = =>
        Promise.try(getHref).then (href) =>
          @verifyUpcomingAssertions(href, options)
            .return({
              subject: href
              command: options.command
            })
            .catch (err) =>
              options.error = err

              @_retry resolveHref, options

    hash: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options.command = Cypress.Log.command
          message: ""

      getHash = =>
        @_getLocation("hash")

      do resolveHash = =>
        Promise.try(getHash).then (hash) =>
          @verifyUpcomingAssertions(hash, options)
            .return({
              subject: hash
              command: options.command
            })
            .catch (err) =>
              options.error = err

              @_retry resolveHash, options

    location: (key, options) ->
      ## normalize arguments allowing key + options to be undefined
      ## key can represent the options
      if _.isObject(key) and _.isUndefined(options)
        options = key

      options ?= {}

      _.defaults options, {log: true}

      getLocation = =>
        location = @_getLocation()

        ret = if _.isString(key)
          ## use existential here because we only want to throw
          ## on null or undefined values (and not empty strings)
          location[key] ?
            @throwErr("Location object does have not have key: #{key}")
        else
          location

      if options.log
        options.command = Cypress.Log.command
          message: key ? ""

      do resolveLocation = =>
        Promise.try(getLocation).then (ret) =>
          @verifyUpcomingAssertions(ret, options)
            .return({
              subject: ret
              command: options.command
            })
            .catch (err) =>
              options.error = err

              @_retry resolveLocation, options