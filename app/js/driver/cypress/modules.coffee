do ($Cypress, _, $, Promise, moment) ->

  $Cypress.extend
    ## move these into cypress/modules.coffee
    ## create new modules_spec.coffee
    loadModule: (name) ->
      module = @modules[name]

      if not module
        $Cypress.Utils.throwErrByPath("miscellaneous.module_not_registered", {
          args: { name }
        })

      ## invoke the module with our instance context
      ## and pass back in the Cypress instance, underscore
      ## and jQuery
      module.call(@, @, _, $, Promise, moment)

    loadModules: (names = []) ->
      ## load specific modules
      if names.length
        _.each names, (name) =>
          @loadModule(name)
      else
        ## load all the modules!
        _.each @modules, (value, key) =>
          @loadModule(key)
