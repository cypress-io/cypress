do ($Cypress, _) ->

  $Cypress.extend
    addChildCommand: (key, fn) ->
      @add(key, fn, "child")

    addParentCommand: (key, fn) ->
      @add(key, fn, "parent")

    addDualCommand: (key, fn) ->
      @add(key, fn, "dual")

    ## think about adding this for
    ## custom cy extensions as well
    ## that we want to rollback afterwards
    ## (Cypress.Cy.extend)
    prepareForCustomCommands: ->
      ## remove any existing custom commands
      @removeCustomCommands()

      ## backup old inject
      @_inject = @inject

      _this = @

      @_customCommands = []

      ## override inject to hold onto a copy of all custom commands
      @inject = _.wrap @inject, (orig, key, fn, type) ->
        _this._customCommands.push(key)

        orig.call(@, key, fn, type)

    removeCustomCommands: ->
      ## restore old inject
      @inject = @_inject if @_inject

      _.each @_customCommands ? [], (key) ->
        delete $Cypress.Cy.prototype[key]
        delete $Cypress.Cy.prototype.sync[key]
        $Cypress.Chainer.remove(key)

    add: (key, fn, type) ->
      throw new Error("Cypress.add(key, fn, type) must include a type!") if not type

      ## allow object signature
      if _.isObject(key)
        _.each key, (fn, name) =>
          @add(name, fn, type)
        return @

      ## need to pass the options into inject here
      @inject(key, fn, type)
      return @

    inject: (key, fn, type) ->
      _this = @

      prepareSubject = (subject, args) ->
        ## if we already have a subject
        ## then replace the first argument
        ## with the new subject.
        ## i think this is now deprecated
        ## based on the way args are passed
        ## it will always be a new array of arguments
        ## and therefore we dont have to deal with
        ## the edge case of mutating args with subject
        ## later.  however theres not enough tests
        ## around this so we'll leave it in place for now.
        if args.hasSubject
          args.splice(0, 1, subject)
        else
          args.unshift(subject)

        args.hasSubject or= true
        args

      wrap = (fn) ->
        switch type
          when "parent"
            return fn

          when "dual"
            _.wrap fn, (orig, args...) ->
              subject = @prop("subject")
              args = prepareSubject(subject, args)

              return orig.apply(@, args)

          when "child"
            _.wrap fn, (orig, args...) ->
              @ensureParent()

              ## push the subject into the args
              subject = @prop("subject")
              args = prepareSubject(subject, args)

              ret = orig.apply(@, args)
              return ret ? subject

      $Cypress.Cy.prototype[key] = (args...) ->
        ## this is the first call on cypress
        ## so create a new chainer instance
        chain = $Cypress.Chainer.create(@, key, args)

        ## store the chain so we can access it later
        @prop("chain", chain)

        return chain

      ## reference a synchronous version of this function
      ## fix this for synchronous chainer version!
      $Cypress.Cy.prototype.sync[key] = (args...) ->
        wrap(fn).apply(_this.cy, args)

      ## add this function to our chainer class
      $Cypress.Chainer.inject key, (chainerId, args) ->
        @enqueue(key, wrap.call(@, fn), args, type, chainerId)
