$Cypress.EnvironmentVariables = do ($Cypress, _) ->

  $Cypress.extend
    env: (key, value) ->
      env = @environmentVariables

      $Cypress.Utils.throwErrByPath("env.variables_missing") if not env

      env.getOrSet.apply(env, arguments)

  class $EnvironmentVariables
    constructor: (obj = {}) ->
      @env = {}

      @set(obj)

    getOrSet: (key, value) ->
      switch
        when arguments.length is 0
          @get()
        when arguments.length is 1
          if _.isString(key)
            @get(key)
          else
            @set(key)
        else
          @set(key, value)

    get: (key) ->
      if key
        @env[key]
      else
        @env

    set: (key, value) ->
      if _.isObject(key)
        obj = key
      else
        obj = {}
        obj[key] = value

      _.extend(@env, obj)

    @create = (Cypress, obj) ->
      Cypress.environmentVariables = new $EnvironmentVariables(obj)

  return $EnvironmentVariables
