do (Cypress, _) ->

  Cypress.addChildCommand
    to: (subject, chainers, args...) ->
      exp = Cypress.Chai.expect(subject).to

      chainers = chainers.split(".")
      lastChainer = _(chainers).last()

      ## backup the original assertion subject
      originalObj = exp._obj

      _.reduce chainers, (memo, value) =>
        if value not of memo
          @throwErr("The chainer: '#{value}' was not found. Building implicit expectation failed.")

        if value is lastChainer
          if _.isFunction(memo[value])
            memo[value].apply(memo, args)
        else
          memo[value]
      , exp

      ## if the _obj has been mutated then we
      ## are chaining assertion properties and
      ## should return this new subject
      if originalObj isnt exp._obj
        return exp._obj

      return subject

    should: (subject, args...) ->
      @sync.to.apply(@, args)