do (Cypress, _) ->

  Cypress.addChildCommand
    to: (subject, chainers, args...) ->
      exp = Cypress.Chai.expect(subject).to

      chainers = chainers.split(".")
      lastChainer = _(chainers).last()

      _.reduce chainers, (memo, value) =>
        if value not of memo
          @throwErr("The chainer: '#{value}' was not found. Building implicit expectation failed.")

        if value is lastChainer
          if _.isFunction(memo[value])
            memo[value].apply(memo, args)
        else
          memo[value]
      , exp

      return subject