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

      href = @sync.location("href", {log: false})

      if options.log
        command = Cypress.Log.command
          message: ""
          snapshot: true

        return {subject: href, command: command}

      return href

    hash: (options = {}) ->
      _.defaults options, {log: true}

      hash = @sync.location("hash", {log: false})

      if options.log
        command = Cypress.Log.command
          message: ""
          snapshot: true

        return {subject: hash, command: command}

      return hash

    location: (key, options) ->
      ## normalize arguments allowing key + options to be undefined
      ## key can represent the options
      if _.isObject(key) and _.isUndefined(options)
        options = key

      options ?= {}

      _.defaults options, {log: true}

      # currentUrl = window.location.toString()
      remoteUrl  = @private("window").location.toString()

      location = Cypress.Location.create(remoteUrl)

      ret = if _.isString(key)
        ## use existential here because we only want to throw
        ## on null or undefined values (and not empty strings)
        location[key] ?
          @throwErr("Location object does have not have key: #{key}")
      else
        location

      if options.log
        command = Cypress.Log.command
          message: key ? ""
          snapshot: true

        return {subject: ret, command: command}

      return ret