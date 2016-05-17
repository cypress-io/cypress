$Cypress.Config = do ($Cypress, _) ->

  return {
    create: (Cypress, config) ->
      get = (key) ->
        if key
          config[key]
        else
          config

      set = (key, value) ->
        if _.isObject(key)
          obj = key
        else
          obj = {}
          obj[key] = value

        _.extend(config, obj)

      Cypress.config = (key, value) ->
        switch arguments.length
          when 0
            get()
          when 1
            if _.isString(key)
              get(key)
            else
              set(key)
          else
            set(key, value)
  }