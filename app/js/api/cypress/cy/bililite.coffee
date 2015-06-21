do ($Cypress, _, bililiteRange) ->

  dispatch = bililiteRange.fn.dispatch

  $Cypress.Cy.extend
    bililite: (el) ->
      b = bililiteRange(el)

      ## nuke native dispatch since
      ## we handle firing events ourselves
      if b.dispatch is dispatch
        @override(b)

      return b

    override: (b) ->
      ## set dispatch to noop
      bililiteRange.fn.dispatch = -> return @